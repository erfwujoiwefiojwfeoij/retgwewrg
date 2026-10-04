const { prisma } = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { audit } = require('../services/notify');
const { uniqueSlug, baseSlug } = require('../utils/slug');
const { pageParams, pageMeta } = require('../utils/pagination');

async function users(req, res) {
  const { page, pageSize, skip } = pageParams(req.query);
  const where = req.query.q
    ? {
        OR: [
          { email: { contains: req.query.q, mode: 'insensitive' } },
          { profile: { firstName: { contains: req.query.q, mode: 'insensitive' } } },
          { profile: { lastName: { contains: req.query.q, mode: 'insensitive' } } },
        ],
      }
    : {};
  if (req.query.role) where.role = req.query.role;
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);
  res.json({
    data: rows.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      banned: user.banned,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      profile: user.profile,
    })),
    meta: pageMeta(page, pageSize, total),
  });
}

async function banUser(req, res) {
  if (req.params.id === req.user.id) throw new AppError(400, 'Нельзя заблокировать себя');
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { banned: req.body.banned } });
  if (req.body.banned) await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  await audit(req.user.id, req.body.banned ? 'ban' : 'unban', 'User', user.id);
  res.json({ data: { id: user.id, banned: user.banned } });
}

async function salons(req, res) {
  const rows = await prisma.salon.findMany({
    include: { owner: { select: { email: true } }, _count: { select: { masters: true, bookings: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: rows });
}

async function verifySalon(req, res) {
  const salon = await prisma.salon.update({ where: { id: req.params.id }, data: { verified: req.body.verified } });
  await audit(req.user.id, 'verify', 'Salon', salon.id, { verified: salon.verified });
  res.json({ data: salon });
}

async function removeSalon(req, res) {
  await prisma.salon.delete({ where: { id: req.params.id } });
  await audit(req.user.id, 'delete', 'Salon', req.params.id);
  res.json({ data: { ok: true } });
}

async function masters(req, res) {
  const rows = await prisma.master.findMany({
    include: { salon: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: rows });
}

async function verifyMaster(req, res) {
  const master = await prisma.master.update({ where: { id: req.params.id }, data: { verified: req.body.verified } });
  await audit(req.user.id, 'verify', 'Master', master.id, { verified: master.verified });
  res.json({ data: master });
}

async function bookings(req, res) {
  const rows = await prisma.booking.findMany({
    include: {
      master: { select: { firstName: true, lastName: true } },
      service: { select: { name: true } },
      salon: { select: { name: true } },
    },
    orderBy: { startAt: 'desc' },
    take: 200,
  });
  res.json({ data: rows });
}

async function reviews(req, res) {
  const rows = await prisma.review.findMany({
    include: { author: { include: { profile: true } }, salon: { select: { name: true } }, master: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json({ data: rows });
}

async function removeReview(req, res) {
  const review = await prisma.review.delete({ where: { id: req.params.id } });
  await audit(req.user.id, 'delete', 'Review', review.id);
  res.json({ data: { ok: true } });
}

async function reports(req, res) {
  const [usersCount, salonsCount, mastersCount, bookingsCount, revenue, byStatus] = await Promise.all([
    prisma.user.count(),
    prisma.salon.count(),
    prisma.master.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({ where: { status: 'COMPLETED' }, _sum: { price: true } }),
    prisma.booking.groupBy({ by: ['status'], _count: true }),
  ]);
  res.json({
    data: {
      users: usersCount,
      salons: salonsCount,
      masters: mastersCount,
      bookings: bookingsCount,
      revenue: revenue._sum.price || 0,
      byStatus,
    },
  });
}

async function categories(req, res) {
  const rows = await prisma.serviceCategory.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { services: true } } } });
  res.json({ data: rows });
}

async function createCategory(req, res) {
  const slug = req.body.slug ? baseSlug(req.body.slug) : await uniqueSlug('serviceCategory', req.body.nameEn);
  const row = await prisma.serviceCategory.create({ data: { name: req.body.name, nameEn: req.body.nameEn, slug } });
  res.status(201).json({ data: row });
}

async function patchCategory(req, res) {
  const row = await prisma.serviceCategory.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      nameEn: req.body.nameEn,
      ...(req.body.slug ? { slug: baseSlug(req.body.slug) } : {}),
    },
  });
  res.json({ data: row });
}

async function removeCategory(req, res) {
  const count = await prisma.service.count({ where: { categoryId: req.params.id } });
  if (count) throw new AppError(409, 'В категории есть услуги');
  await prisma.serviceCategory.delete({ where: { id: req.params.id } });
  res.json({ data: { ok: true } });
}

async function settings(req, res) {
  const rows = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
  res.json({ data: rows });
}

async function putSetting(req, res) {
  const row = await prisma.systemSetting.upsert({
    where: { key: req.body.key },
    update: { value: req.body.value },
    create: { key: req.body.key, value: req.body.value },
  });
  await audit(req.user.id, 'setting', 'SystemSetting', row.key);
  res.json({ data: row });
}

module.exports = {
  users,
  banUser,
  salons,
  verifySalon,
  removeSalon,
  masters,
  verifyMaster,
  bookings,
  reviews,
  removeReview,
  reports,
  categories,
  createCategory,
  patchCategory,
  removeCategory,
  settings,
  putSetting,
};
