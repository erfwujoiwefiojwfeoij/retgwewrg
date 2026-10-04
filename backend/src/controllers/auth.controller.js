const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { jwtAccessSecret, jwtRefreshSecret, isProd } = require('../config/env');
const { AppError } = require('../utils/errors');
const { sha256, randomToken } = require('../utils/crypto');
const { publicUser } = require('../utils/present');
const { sendMail, appLink, exposeDevLink } = require('../utils/mailer');
const { cookieOptions } = require('../middleware/csrf');
const { audit } = require('../services/notify');
const { accountEmail } = require('../utils/staff');

const WEEK = 7 * 24 * 60 * 60 * 1000;

function signAccess(user) {
  return jwt.sign({ sub: user.id, role: user.role, type: 'access' }, jwtAccessSecret, { expiresIn: '15m' });
}

async function signRefresh(user) {
  const jti = randomToken();
  const token = jwt.sign({ sub: user.id, type: 'refresh', jti }, jwtRefreshSecret, { expiresIn: '7d' });
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: sha256(jti), expiresAt: new Date(Date.now() + WEEK) },
  });
  return token;
}

function setSession(res, access, refresh) {
  const base = cookieOptions();
  res.cookie('access_token', access, { ...base, httpOnly: true, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refresh, { ...base, httpOnly: true, maxAge: WEEK });
}

function clearSession(res) {
  const base = cookieOptions();
  res.clearCookie('access_token', { ...base, httpOnly: true });
  res.clearCookie('refresh_token', { ...base, httpOnly: true });
}

async function issueEmailToken(userId, type) {
  const token = randomToken();
  await prisma.emailToken.deleteMany({ where: { userId, type } });
  await prisma.emailToken.create({
    data: {
      userId,
      type,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + (type === 'reset' ? 60 : 24 * 60) * 60 * 1000),
    },
  });
  return token;
}

async function register(req, res) {
  const { email, password, role, firstName, lastName, phone, city } = req.body;
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) throw new AppError(409, 'Такой email уже зарегистрирован', { email: 'Уже используется' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      role,
      profile: {
        create: {
          firstName,
          lastName,
          phone: phone || null,
          city: city || null,
        },
      },
    },
    include: { profile: true },
  });
  const token = await issueEmailToken(user.id, 'verify');
  const link = appLink(`/verify-email?token=${token}`);
  const mailed = await sendMail({
    to: user.email,
    subject: 'Подтвердите email в LUNEA',
    text: 'Перейдите по ссылке, чтобы подтвердить адрес.',
    link,
  });
  await audit(user.id, 'register', 'User', user.id);
  res.status(201).json({
    data: { email: user.email, devLink: exposeDevLink(mailed) },
    message: 'Аккаунт создан. Подтвердите email.',
  });
}

async function login(req, res) {
  const email = accountEmail(req.body.email);
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!user) throw new AppError(401, 'Неверный email или пароль');
  const ok = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!ok) throw new AppError(401, 'Неверный email или пароль');
  if (user.banned) throw new AppError(403, 'Аккаунт заблокирован');
  if (!user.emailVerified) throw new AppError(403, 'Сначала подтвердите email');
  const access = signAccess(user);
  const refresh = await signRefresh(user);
  setSession(res, access, refresh);
  await audit(user.id, 'login', 'User', user.id);
  res.json({ data: publicUser(user) });
}

async function logout(req, res) {
  const token = req.cookies.refresh_token;
  if (token) {
    try {
      const payload = jwt.verify(token, jwtRefreshSecret);
      await prisma.refreshToken.deleteMany({ where: { tokenHash: sha256(payload.jti) } });
    } catch {
      // ignore invalid refresh on logout
    }
  }
  clearSession(res);
  res.json({ data: { ok: true } });
}

async function refresh(req, res) {
  const token = req.cookies.refresh_token;
  if (!token) throw new AppError(401, 'Сессия истекла');
  let payload;
  try {
    payload = jwt.verify(token, jwtRefreshSecret);
  } catch {
    throw new AppError(401, 'Сессия истекла');
  }
  if (payload.type !== 'refresh') throw new AppError(401, 'Сессия истекла');
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(payload.jti) } });
  if (!stored || stored.expiresAt < new Date()) throw new AppError(401, 'Сессия истекла');
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { profile: true } });
  if (!user || user.banned) throw new AppError(401, 'Сессия истекла');
  const access = signAccess(user);
  const nextRefresh = await signRefresh(user);
  setSession(res, access, nextRefresh);
  res.json({ data: publicUser(user) });
}

async function me(req, res) {
  if (!req.user) throw new AppError(401, 'Нужно войти в аккаунт');
  res.json({ data: publicUser(req.user) });
}

async function updateMe(req, res) {
  const { firstName, lastName, phone, city, bio, notifyEmail, avatar } = req.body;
  const profile = await prisma.profile.update({
    where: { userId: req.user.id },
    data: {
      firstName,
      lastName,
      phone: phone || null,
      city: city || null,
      bio: bio || null,
      notifyEmail: notifyEmail ?? undefined,
      avatar: avatar || null,
    },
  });
  if (req.user.master) {
    await prisma.master.update({
      where: { id: req.user.master.id },
      data: {
        firstName,
        lastName,
        city: city || req.user.master.city,
        bio: bio ?? req.user.master.bio,
        photo: avatar || req.user.master.photo,
      },
    });
  }
  res.json({ data: publicUser({ ...req.user, profile }) });
}

async function forgot(req, res) {
  const user = await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } });
  let devLink;
  if (user && !user.banned) {
    const token = await issueEmailToken(user.id, 'reset');
    const link = appLink(`/reset-password?token=${token}`);
    const mailed = await sendMail({
      to: user.email,
      subject: 'Сброс пароля LUNEA',
      text: 'Ссылка действует один час.',
      link,
    });
    devLink = exposeDevLink(mailed);
  }
  res.json({
    message: 'Если адрес зарегистрирован, мы отправили ссылку для сброса.',
    data: { devLink: isProd ? undefined : devLink },
  });
}

async function reset(req, res) {
  const tokenHash = sha256(req.body.token);
  const row = await prisma.emailToken.findUnique({ where: { tokenHash } });
  if (!row || row.type !== 'reset' || row.expiresAt < new Date()) {
    throw new AppError(400, 'Ссылка недействительна или устарела');
  }
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  await prisma.user.update({ where: { id: row.userId }, data: { passwordHash } });
  await prisma.emailToken.deleteMany({ where: { userId: row.userId, type: 'reset' } });
  await prisma.refreshToken.deleteMany({ where: { userId: row.userId } });
  res.json({ message: 'Пароль обновлён. Можно входить.' });
}

async function verifyEmail(req, res) {
  const tokenHash = sha256(req.body.token);
  const row = await prisma.emailToken.findUnique({ where: { tokenHash } });
  if (!row || row.type !== 'verify' || row.expiresAt < new Date()) {
    throw new AppError(400, 'Ссылка недействительна или устарела');
  }
  await prisma.user.update({ where: { id: row.userId }, data: { emailVerified: true } });
  await prisma.emailToken.deleteMany({ where: { userId: row.userId, type: 'verify' } });
  res.json({ message: 'Email подтверждён.' });
}

async function csrf(req, res) {
  res.json({ data: { csrf: req.cookies.csrf_token } });
}

module.exports = { register, login, logout, refresh, me, updateMe, forgot, reset, verifyEmail, csrf };
