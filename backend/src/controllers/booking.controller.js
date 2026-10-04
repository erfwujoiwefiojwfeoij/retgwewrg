const { prisma } = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { publicId } = require('../utils/crypto');
const { loadMasterDay, datesWithSlots, assertSlotFree, assertResourceFree } = require('../services/availability');
const { resolveServicePrice, workspace } = require('../services/access');
const { notify, audit, recomputeRatings, touchClient } = require('../services/notify');

const bookingInclude = {
  master: { select: { id: true, slug: true, firstName: true, lastName: true, photo: true, specialization: true } },
  service: { select: { id: true, name: true, durationMin: true } },
  salon: { select: { id: true, slug: true, name: true, address: true, city: true } },
  review: true,
};

async function availability(req, res) {
  const { masterId, serviceId, date } = req.query;
  if (!masterId || !serviceId) throw new AppError(400, 'Нужны мастер и услуга');
  const priced = await resolveServicePrice(masterId, serviceId);
  const slotOptions = { serviceId: priced.service.id, capacity: priced.service.capacity || 1 };
  if (date) {
    const slots = await loadMasterDay(masterId, date, priced.durationMin, slotOptions);
    return res.json({ data: { date, durationMin: priced.durationMin, capacity: slotOptions.capacity, slots } });
  }
  const dates = await datesWithSlots(masterId, priced.durationMin, 21, slotOptions);
  return res.json({ data: { durationMin: priced.durationMin, capacity: slotOptions.capacity, dates } });
}

async function createBooking(req, res) {
  const startAt = new Date(req.body.startAt);
  const priced = await resolveServicePrice(req.body.masterId, req.body.serviceId);
  const endAt = new Date(startAt.getTime() + priced.durationMin * 60 * 1000);
  const master = await prisma.master.findUnique({ where: { id: req.body.masterId } });
  if (!master || master.suspended) throw new AppError(400, 'Мастер недоступен');
  const capacity = priced.service.capacity || 1;
  await assertSlotFree({
    masterId: master.id,
    startAt,
    endAt,
    durationMin: priced.durationMin,
    serviceId: priced.service.id,
    capacity,
  });
  const booking = await prisma.$transaction(async (tx) => {
    const overlapping = await tx.booking.findMany({
      where: {
        masterId: master.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    const group = capacity > 1 && overlapping.every((item) => item.serviceId === priced.service.id && item.startAt.getTime() === startAt.getTime());
    const seats = overlapping.reduce((sum, item) => sum + (item.seats || 1), 0);
    if (overlapping.length && !(group && seats < capacity)) throw new AppError(409, 'Это время уже занято');
    return tx.booking.create({
      data: {
        publicId: publicId(),
        clientId: req.user?.id || null,
        salonId: master.salonId,
        masterId: master.id,
        serviceId: priced.service.id,
        startAt,
        endAt,
        status: 'PENDING',
        clientName: req.body.clientName,
        clientPhone: req.body.clientPhone,
        clientEmail: req.body.clientEmail.toLowerCase(),
        notes: req.body.notes || null,
        price: priced.price,
      },
      include: bookingInclude,
    });
  });
  await touchClient({
    salonId: master.salonId,
    userId: req.user?.id,
    name: req.body.clientName,
    phone: req.body.clientPhone,
    email: req.body.clientEmail.toLowerCase(),
  });
  await notify(req.user?.id, 'BOOKING_CREATED', 'Запись создана', `${priced.service.name} · ${booking.publicId}`, `/dashboard/appointments`);
  if (master.salonId) {
    const salon = await prisma.salon.findUnique({ where: { id: master.salonId } });
    await notify(salon?.ownerId, 'BOOKING_CREATED', 'Новая запись', `${req.body.clientName} · ${priced.service.name}`, '/business/appointments');
  }
  if (master.userId && master.userId !== req.user?.id) {
    await notify(master.userId, 'BOOKING_CREATED', 'Новая запись', `${req.body.clientName} · ${priced.service.name}`, '/business/appointments');
  }
  await audit(req.user?.id, 'create', 'Booking', booking.id);
  res.status(201).json({ data: booking });
}

async function listBookings(req, res) {
  const where = {};
  if (req.query.scope === 'business') {
    const space = await workspace(req.user);
    if (space.type === 'salon') where.salonId = space.salon.id;
    else if (space.type === 'master') where.masterId = space.master.id;
    else throw new AppError(403, 'Нет кабинета');
  } else if (req.user?.role === 'SUPER_ADMIN' && req.query.all === '1') {
    // admin list
  } else {
    where.clientId = req.user.id;
  }
  if (req.query.status) where.status = req.query.status;
  if (req.query.masterId) where.masterId = req.query.masterId;
  if (req.query.from || req.query.to) {
    where.startAt = {
      ...(req.query.from ? { gte: new Date(req.query.from) } : {}),
      ...(req.query.to ? { lte: new Date(req.query.to) } : {}),
    };
  }
  const rows = await prisma.booking.findMany({
    where,
    include: bookingInclude,
    orderBy: { startAt: req.query.order === 'desc' ? 'desc' : 'asc' },
    take: 300,
  });
  res.json({ data: rows });
}

async function getBooking(req, res) {
  const booking = await prisma.booking.findFirst({
    where: { OR: [{ id: req.params.id }, { publicId: req.params.id }] },
    include: bookingInclude,
  });
  if (!booking) throw new AppError(404, 'Запись не найдена');
  const masterUser = await prisma.master.findUnique({ where: { id: booking.masterId }, select: { userId: true } });
  const allowed = req.user && (
    booking.clientId === req.user.id
    || req.user.role === 'SUPER_ADMIN'
    || masterUser?.userId === req.user.id
    || (booking.salonId && await prisma.salon.findFirst({ where: { id: booking.salonId, OR: [{ ownerId: req.user.id }, { members: { some: { userId: req.user.id } } }] } }))
  );
  if (!allowed && booking.clientEmail !== req.user?.email) throw new AppError(403, 'Нет доступа к записи');
  res.json({ data: booking });
}

async function patchBooking(req, res) {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { master: true, service: true, salon: true },
  });
  if (!booking) throw new AppError(404, 'Запись не найдена');
  const space = req.user ? await workspace(req.user).catch(() => null) : null;
  const isClient = req.user && booking.clientId === req.user.id;
  const isStaff = req.user && (
    req.user.role === 'SUPER_ADMIN'
    || booking.master.userId === req.user.id
    || (space?.salon && space.salon.id === booking.salonId)
  );
  if (!isClient && !isStaff) throw new AppError(403, 'Нет доступа к записи');

  const data = {};
  if (req.body.startAt) {
    if (!isStaff) throw new AppError(403, 'Переносить запись может салон');
    const startAt = new Date(req.body.startAt);
    const duration = Math.round((booking.endAt - booking.startAt) / 60000);
    const endAt = new Date(startAt.getTime() + duration * 60000);
    await assertSlotFree({
      masterId: booking.masterId,
      startAt,
      endAt,
      durationMin: duration,
      ignoreBookingId: booking.id,
      serviceId: booking.serviceId,
      capacity: booking.service.capacity || 1,
    });
    data.startAt = startAt;
    data.endAt = endAt;
  }
  if (req.body.resourceId !== undefined) {
    if (req.body.resourceId) {
      const resource = await prisma.resource.findFirst({ where: { id: req.body.resourceId, salonId: booking.salonId } });
      if (!resource) throw new AppError(400, 'Ресурс не найден');
    }
    const startAt = data.startAt || booking.startAt;
    const endAt = data.endAt || booking.endAt;
    await assertResourceFree({
      resourceId: req.body.resourceId || null,
      startAt,
      endAt,
      ignoreBookingId: booking.id,
    });
    data.resourceId = req.body.resourceId || null;
  }
  if (req.body.prepaid != null) {
    if (!isStaff) throw new AppError(403, 'Предоплату отмечает салон');
    data.prepaid = req.body.prepaid;
  }
  if (req.body.status) {
    const next = req.body.status;
    if (isClient && !isStaff) {
      if (next !== 'CANCELLED' || !['PENDING', 'CONFIRMED'].includes(booking.status)) {
        throw new AppError(403, 'Эту запись нельзя отменить');
      }
    }
    data.status = next;
  }
  const updated = await prisma.booking.update({ where: { id: booking.id }, data, include: bookingInclude });
  if (data.status === 'CONFIRMED') {
    await notify(booking.clientId, 'BOOKING_CONFIRMED', 'Запись подтверждена', booking.publicId, '/dashboard/appointments');
  }
  if (data.status === 'CANCELLED') {
    await notify(booking.clientId, 'BOOKING_CANCELLED', 'Запись отменена', booking.publicId, '/dashboard/appointments');
    if (booking.salon) await notify(booking.salon.ownerId, 'BOOKING_CANCELLED', 'Запись отменена', booking.publicId, '/business/appointments');
    if (booking.salonId) {
      const wishDate = new Date(`${new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(booking.startAt)}T00:00:00.000Z`);
      await prisma.waitEntry.updateMany({
        where: { salonId: booking.salonId, status: 'WAITING', wishDate },
        data: { status: 'OFFERED' },
      });
    }
  }
  if (data.status === 'COMPLETED') {
    await notify(booking.clientId, 'BOOKING_COMPLETED', 'Визит завершён', booking.service.name, '/dashboard/appointments');
    await notify(booking.clientId, 'REVIEW_REQUEST', 'Как прошёл визит?', 'Оставьте короткий отзыв', `/dashboard/appointments?review=${booking.id}`);
  }
  await audit(req.user.id, 'update', 'Booking', booking.id, data);
  res.json({ data: updated });
}

async function createReview(req, res) {
  const booking = await prisma.booking.findUnique({ where: { id: req.body.bookingId } });
  if (!booking) throw new AppError(404, 'Запись не найдена');
  if (booking.clientId !== req.user.id) throw new AppError(403, 'Отзыв оставляет клиент записи');
  if (booking.status !== 'COMPLETED') throw new AppError(400, 'Отзыв доступен после визита');
  const existing = await prisma.review.findUnique({ where: { bookingId: booking.id } });
  if (existing) throw new AppError(409, 'Отзыв уже оставлен');
  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      authorId: req.user.id,
      salonId: booking.salonId,
      masterId: booking.masterId,
      rating: req.body.rating,
      comment: req.body.comment,
    },
  });
  await recomputeRatings(booking.masterId, booking.salonId);
  res.status(201).json({ data: review });
}

async function replyReview(req, res) {
  const review = await prisma.review.findUnique({ where: { id: req.params.id }, include: { salon: true } });
  if (!review) throw new AppError(404, 'Отзыв не найден');
  const space = await workspace(req.user);
  const allowed = req.user.role === 'SUPER_ADMIN'
    || (review.salon && space.salon && space.salon.id === review.salonId)
    || (space.master && space.master.id === review.masterId);
  if (!allowed) throw new AppError(403, 'Нет доступа');
  const updated = await prisma.review.update({
    where: { id: review.id },
    data: { reply: req.body.reply, replyAt: new Date() },
  });
  res.json({ data: updated });
}

async function listReviews(req, res) {
  const where = {
    ...(req.query.salonId ? { salonId: req.query.salonId } : {}),
    ...(req.query.masterId ? { masterId: req.query.masterId } : {}),
  };
  if (req.query.scope === 'business') {
    const space = await workspace(req.user);
    if (space.type === 'salon') where.salonId = space.salon.id;
    else if (space.type === 'master') where.masterId = space.master.id;
  }
  const rows = await prisma.review.findMany({
    where,
    include: {
      author: { include: { profile: true } },
      master: { select: { firstName: true, lastName: true, slug: true } },
      salon: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ data: rows });
}

module.exports = {
  availability,
  createBooking,
  listBookings,
  getBooking,
  patchBooking,
  createReview,
  replyReview,
  listReviews,
};
