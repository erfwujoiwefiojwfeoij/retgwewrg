const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { jwtAccessSecret } = require('../config/env');
const { AppError } = require('../utils/errors');

async function loadUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, master: true },
  });
}

async function attachUser(req, res, next) {
  const token = req.cookies.access_token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, jwtAccessSecret);
    if (payload.type !== 'access') return next();
    const user = await loadUser(payload.sub);
    if (user && !user.banned) req.user = user;
  } catch {
    // expired access token is resolved by refresh on the client
  }
  return next();
}

function requireAuth(req, res, next) {
  if (!req.user) return next(new AppError(401, 'Нужно войти в аккаунт'));
  return next();
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(401, 'Нужно войти в аккаунт'));
    if (!roles.includes(req.user.role)) return next(new AppError(403, 'Недостаточно прав'));
    return next();
  };
}

async function salonAccess(user, salonId) {
  if (!user) return null;
  if (user.role === 'SUPER_ADMIN') {
    return prisma.salon.findUnique({ where: { id: salonId } });
  }
  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) return null;
  if (salon.ownerId === user.id) return salon;
  const member = await prisma.salonMember.findUnique({
    where: { salonId_userId: { salonId, userId: user.id } },
  });
  if (member) return salon;
  return null;
}

async function requireSalon(req, res, next) {
  try {
    const salonId = req.params.salonId || req.params.id || req.body.salonId;
    const salon = await salonAccess(req.user, salonId);
    if (!salon) return next(new AppError(403, 'Нет доступа к салону'));
    req.salon = salon;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { attachUser, requireAuth, requireRoles, salonAccess, requireSalon, loadUser };
