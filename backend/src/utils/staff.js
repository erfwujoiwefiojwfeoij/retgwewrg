const { prisma } = require('../lib/prisma');
const { baseSlug } = require('./slug');
const { staffPassword } = require('./crypto');
const { AppError } = require('./errors');

const STAFF_DOMAIN = '@staff.lunea';

function staffLogin(email) {
  if (!email || !email.endsWith(STAFF_DOMAIN)) return null;
  return email.slice(0, -STAFF_DOMAIN.length);
}

function accountEmail(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return raw;
  return raw.includes('@') ? raw : `${raw}${STAFF_DOMAIN}`;
}

async function uniqueStaffLogin(firstName, lastName) {
  const root = baseSlug(`${firstName}.${lastName}`).replace(/-/g, '.') || 'master';
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const login = `${root}.${suffix}`;
    const email = `${login}${STAFF_DOMAIN}`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) return { login, email };
  }
  throw new AppError(500, 'Не удалось создать логин');
}

async function issueMasterAccess({ firstName, lastName, city, userId }) {
  const bcrypt = require('bcryptjs');
  const password = staffPassword();
  const passwordHash = await bcrypt.hash(password, 12);
  if (userId) {
    const user = await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { login: staffLogin(user.email) || user.email, password };
  }
  const { login, email } = await uniqueStaffLogin(firstName, lastName);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'MASTER',
      emailVerified: true,
      profile: { create: { firstName, lastName, city: city || null } },
    },
  });
  return { userId: user.id, login, password };
}

module.exports = { STAFF_DOMAIN, staffLogin, accountEmail, issueMasterAccess };
