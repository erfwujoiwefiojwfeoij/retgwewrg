const { prisma } = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { workspace } = require('../services/access');
const { dateStringMoscow } = require('../utils/time');

async function toggleFavorite(req, res) {
  const { targetType, targetId } = req.body;
  const existing = await prisma.favorite.findUnique({
    where: { userId_targetType_targetId: { userId: req.user.id, targetType, targetId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return res.json({ data: { saved: false } });
  }
  await prisma.favorite.create({ data: { userId: req.user.id, targetType, targetId } });
  return res.json({ data: { saved: true } });
}

async function listFavorites(req, res) {
  const rows = await prisma.favorite.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  const ids = (type) => rows.filter((row) => row.targetType === type).map((row) => row.targetId);
  const [salons, masters, services] = await Promise.all([
    prisma.salon.findMany({ where: { id: { in: ids('SALON') } } }),
    prisma.master.findMany({ where: { id: { in: ids('MASTER') } } }),
    prisma.service.findMany({ where: { id: { in: ids('SERVICE') } }, include: { category: true, salon: { select: { name: true, slug: true } } } }),
  ]);
  res.json({
    data: rows.map((row) => ({
      ...row,
      salon: salons.find((item) => item.id === row.targetId) || null,
      master: masters.find((item) => item.id === row.targetId) || null,
      service: services.find((item) => item.id === row.targetId) || null,
    })),
  });
}

async function listNotifications(req, res) {
  const rows = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });
  const unread = rows.filter((row) => !row.read).length;
  res.json({ data: rows, meta: { unread } });
}

async function readNotifications(req, res) {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, ...(req.body?.id ? { id: req.body.id } : {}) },
    data: { read: true },
  });
  res.json({ data: { ok: true } });
}

async function listThreads(req, res) {
  const space = await workspace(req.user).catch(() => ({ type: 'none' }));
  const where = req.query.scope === 'business' && space.salon
    ? { salonId: space.salon.id }
    : { clientId: req.user.id };
  const rows = await prisma.messageThread.findMany({
    where,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      client: { include: { profile: true } },
      salon: { select: { name: true, slug: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ data: rows });
}

async function getThread(req, res) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: req.params.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, include: { author: { include: { profile: true } } } },
      salon: { select: { id: true, name: true, ownerId: true } },
    },
  });
  if (!thread) throw new AppError(404, 'Диалог не найден');
  const member = thread.salon
    ? await prisma.salonMember.findUnique({ where: { salonId_userId: { salonId: thread.salon.id, userId: req.user.id } } })
    : null;
  const allowed = thread.clientId === req.user.id || thread.salon?.ownerId === req.user.id || member || req.user.role === 'SUPER_ADMIN';
  if (!allowed) throw new AppError(403, 'Нет доступа');
  res.json({ data: thread });
}

async function createThread(req, res) {
  if (!req.body.salonId && !req.body.masterId) throw new AppError(400, 'Укажите салон или мастера');
  const thread = await prisma.messageThread.create({
    data: {
      clientId: req.user.id,
      salonId: req.body.salonId || null,
      masterId: req.body.masterId || null,
      subject: req.body.subject,
      messages: { create: { authorId: req.user.id, body: req.body.body } },
    },
    include: { messages: true },
  });
  res.status(201).json({ data: thread });
}

async function postMessage(req, res) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: req.params.id },
    include: { salon: true },
  });
  if (!thread) throw new AppError(404, 'Диалог не найден');
  const member = thread.salonId
    ? await prisma.salonMember.findUnique({ where: { salonId_userId: { salonId: thread.salonId, userId: req.user.id } } })
    : null;
  const allowed = thread.clientId === req.user.id || thread.salon?.ownerId === req.user.id || member;
  if (!allowed) throw new AppError(403, 'Нет доступа');
  const message = await prisma.message.create({
    data: { threadId: thread.id, authorId: req.user.id, body: req.body.body },
  });
  await prisma.messageThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
  res.status(201).json({ data: message });
}

async function businessHome(req, res) {
  const space = await workspace(req.user);
  if (space.type === 'none') return res.json({ data: space });
  const where = space.type === 'salon' ? { salonId: space.salon.id } : { masterId: space.master.id };
  const start = new Date();
  const day = dateStringMoscow(start);
  const from = new Date(`${day}T00:00:00+03:00`);
  const to = new Date(`${day}T23:59:59+03:00`);
  const monthStart = new Date(`${day.slice(0, 8)}01T00:00:00+03:00`);
  const [today, upcoming, revenue, clients, recent, seriesBookings, masters, services] = await Promise.all([
    prisma.booking.findMany({
      where: { ...where, startAt: { gte: from, lte: to }, status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] } },
      include: { master: true, service: true },
      orderBy: { startAt: 'asc' },
    }),
    prisma.booking.findMany({
      where: { ...where, startAt: { gt: to }, status: { in: ['PENDING', 'CONFIRMED'] } },
      include: { master: true, service: true, salon: true },
      orderBy: { startAt: 'asc' },
      take: 6,
    }),
    prisma.booking.aggregate({
      where: { ...where, status: 'COMPLETED', startAt: { gte: monthStart } },
      _sum: { price: true },
      _count: true,
    }),
    prisma.booking.findMany({
      where: { ...where, startAt: { gte: monthStart } },
      select: { clientEmail: true, createdAt: true },
    }),
    prisma.salonClient.findMany({
      where: space.salon ? { salonId: space.salon.id } : { email: '__none__' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.booking.findMany({
      where: { ...where, status: { in: ['COMPLETED', 'CONFIRMED', 'PENDING'] }, startAt: { gte: new Date(Date.now() - 14 * 86400000) } },
      select: { startAt: true, price: true, status: true },
    }),
    space.salon ? prisma.master.count({ where: { salonId: space.salon.id, suspended: false } }) : Promise.resolve(1),
    space.salon ? prisma.service.count({ where: { salonId: space.salon.id, active: true } }) : prisma.masterService.count({ where: { masterId: space.master.id } }),
  ]);
  const emails = new Set();
  let newClients = 0;
  for (const row of clients) {
    if (!emails.has(row.clientEmail)) {
      emails.add(row.clientEmail);
      if (row.createdAt >= monthStart) newClients += 1;
    }
  }
  const bookedMinutes = today.reduce((sum, item) => sum + (item.endAt - item.startAt) / 60000, 0);
  const occupancy = Math.min(100, Math.round((bookedMinutes / (8 * 60)) * 100));
  const seriesMap = new Map();
  for (let i = 13; i >= 0; i -= 1) {
    const key = dateStringMoscow(new Date(Date.now() - i * 86400000));
    seriesMap.set(key, { date: key, revenue: 0, count: 0 });
  }
  for (const row of seriesBookings) {
    const key = dateStringMoscow(row.startAt);
    if (!seriesMap.has(key)) continue;
    const bucket = seriesMap.get(key);
    bucket.count += 1;
    if (row.status === 'COMPLETED') bucket.revenue += row.price;
  }
  res.json({
    data: {
      workspace: space,
      today,
      upcoming,
      revenue: revenue._sum.price || 0,
      completed: revenue._count,
      newClients,
      occupancy,
      recentClients: recent,
      masters,
      services,
      series: [...seriesMap.values()],
    },
  });
}

async function listClients(req, res) {
  const space = await workspace(req.user);
  if (space.type !== 'salon') throw new AppError(403, 'Клиенты доступны в кабинете салона');
  const q = (req.query.q || '').trim();
  const clients = await prisma.salonClient.findMany({
    where: {
      salonId: space.salon.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      photos: { orderBy: { createdAt: 'desc' }, take: 6 },
      formulas: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  });
  const bookings = await prisma.booking.findMany({
    where: { salonId: space.salon.id, clientEmail: { in: clients.map((item) => item.email) } },
    orderBy: { startAt: 'desc' },
  });
  const data = clients.map((client) => {
    const own = bookings.filter((item) => item.clientEmail === client.email);
    const past = own.filter((item) => item.status === 'COMPLETED');
    const upcoming = own.find((item) => ['PENDING', 'CONFIRMED'].includes(item.status) && item.startAt > new Date());
    const lastVisit = past[0]?.startAt || null;
    const days = lastVisit ? (Date.now() - new Date(lastVisit).getTime()) / 86400000 : null;
    let segment = 'новый';
    if (past.length >= 5 && (days == null || days <= 60)) segment = 'постоянный';
    else if (past.length >= 2 && (days == null || days <= 60)) segment = 'возвращается';
    else if (days != null && days > 60) segment = 'спит';
    else if (!past.length && upcoming) segment = 'записан';
    return {
      ...client,
      totalVisits: past.length,
      totalSpent: past.reduce((sum, item) => sum + item.price, 0),
      lastVisit,
      upcoming: upcoming || null,
      segment,
    };
  });
  const withVisits = data.filter((item) => item.totalVisits > 0);
  const returned = withVisits.filter((item) => item.totalVisits >= 2).length;
  res.json({
    data,
    meta: {
      returnRate: withVisits.length ? Math.round((returned / withVisits.length) * 100) : 0,
    },
  });
}

async function patchClient(req, res) {
  const space = await workspace(req.user);
  const client = await prisma.salonClient.findUnique({ where: { id: req.params.id } });
  if (!client || space.salon?.id !== client.salonId) throw new AppError(404, 'Клиент не найден');
  const data = {};
  if (req.body.notes !== undefined) data.notes = req.body.notes;
  if (req.body.consentData !== undefined) data.consentData = req.body.consentData;
  if (req.body.consentAds !== undefined) data.consentAds = req.body.consentAds;
  if (req.body.source !== undefined) data.source = req.body.source || null;
  if (req.body.returnWeeks !== undefined) data.returnWeeks = req.body.returnWeeks;
  const updated = await prisma.salonClient.update({ where: { id: client.id }, data });
  res.json({ data: updated });
}

async function myWorkspace(req, res) {
  const space = await workspace(req.user);
  res.json({ data: space });
}

module.exports = {
  toggleFavorite,
  listFavorites,
  listNotifications,
  readNotifications,
  listThreads,
  getThread,
  createThread,
  postMessage,
  businessHome,
  listClients,
  patchClient,
  myWorkspace,
};
