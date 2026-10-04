const { prisma } = require('../lib/prisma');
const {
  parseMinutes,
  formatMinutes,
  atMoscow,
  weekdayMoscow,
  addDays,
  todayMoscow,
  rangesOverlap,
} = require('../utils/time');

const STEP = 15;

function seatCount(bookings) {
  return bookings.reduce((sum, booking) => sum + (booking.seats || 1), 0);
}

function slotTaken(bookings, startAt, endAt, serviceId, capacity, ignoreBookingId) {
  const overlapping = bookings.filter((booking) => {
    if (ignoreBookingId && booking.id === ignoreBookingId) return false;
    return rangesOverlap(startAt, endAt, booking.startAt, booking.endAt);
  });
  if (!overlapping.length) return false;
  const sameGroup = capacity > 1 && overlapping.every((booking) => (
    booking.serviceId === serviceId && new Date(booking.startAt).getTime() === startAt.getTime()
  ));
  if (sameGroup) return seatCount(overlapping) >= capacity;
  return true;
}

function slotsForDay({ date, durationMin, hour, isDayOff, bookings, serviceId, capacity = 1 }) {
  if (!hour || hour.isOff || isDayOff) return [];
  const open = parseMinutes(hour.startTime);
  const close = parseMinutes(hour.endTime);
  const breakStart = hour.breakStart ? parseMinutes(hour.breakStart) : null;
  const breakEnd = hour.breakEnd ? parseMinutes(hour.breakEnd) : null;
  const slots = [];
  const now = Date.now();
  for (let cursor = open; cursor + durationMin <= close; cursor += STEP) {
    const endMin = cursor + durationMin;
    if (breakStart != null && cursor < breakEnd && endMin > breakStart) continue;
    const startAt = atMoscow(date, cursor);
    const endAt = atMoscow(date, endMin);
    if (startAt.getTime() <= now) continue;
    if (slotTaken(bookings, startAt, endAt, serviceId, capacity)) continue;
    slots.push({
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      label: formatMinutes(cursor),
    });
  }
  return slots;
}

async function loadMasterDay(masterId, date, durationMin, options = {}) {
  const weekday = weekdayMoscow(date);
  const master = await prisma.master.findUnique({ where: { id: masterId }, select: { salonId: true } });
  if (master?.salonId) {
    const closed = await prisma.salonClosure.findUnique({
      where: { salonId_date: { salonId: master.salonId, date: new Date(`${date}T00:00:00.000Z`) } },
    });
    if (closed) return [];
  }
  const [hour, dayOff, bookings] = await Promise.all([
    prisma.workingHour.findFirst({ where: { masterId, dayOfWeek: weekday } }),
    prisma.dayOff.findFirst({ where: { masterId, date: new Date(`${date}T00:00:00.000Z`) } }),
    prisma.booking.findMany({
      where: {
        masterId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt: { lt: atMoscow(date, 24 * 60) },
        endAt: { gt: atMoscow(date, 0) },
      },
    }),
  ]);
  return slotsForDay({
    date,
    durationMin,
    hour,
    isDayOff: Boolean(dayOff),
    bookings,
    serviceId: options.serviceId,
    capacity: options.capacity || 1,
  });
}

async function datesWithSlots(masterId, durationMin, days = 21, options = {}) {
  const start = todayMoscow();
  const dates = [];
  for (let i = 0; i < days; i += 1) {
    const date = addDays(start, i);
    const slots = await loadMasterDay(masterId, date, durationMin, options);
    if (slots.length) dates.push({ date, count: slots.length });
  }
  return dates;
}

async function assertSlotFree({ masterId, startAt, endAt, durationMin, ignoreBookingId, serviceId, capacity = 1 }) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(startAt);
  const slots = await loadMasterDay(masterId, date, durationMin, { serviceId, capacity });
  const match = slots.find((slot) => new Date(slot.startAt).getTime() === startAt.getTime());
  if (!match && !ignoreBookingId) {
    const error = new Error('Это время уже недоступно');
    error.status = 409;
    throw error;
  }
  const bookings = await prisma.booking.findMany({
    where: {
      masterId,
      id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
      status: { in: ['PENDING', 'CONFIRMED'] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (slotTaken(bookings, startAt, endAt, serviceId, capacity, ignoreBookingId)) {
    const error = new Error('Это время уже занято');
    error.status = 409;
    throw error;
  }
}

async function assertResourceFree({ resourceId, startAt, endAt, ignoreBookingId }) {
  if (!resourceId) return;
  const conflict = await prisma.booking.findFirst({
    where: {
      resourceId,
      id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
      status: { in: ['PENDING', 'CONFIRMED'] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (conflict) {
    const error = new Error('Кресло или кабинет уже заняты');
    error.status = 409;
    throw error;
  }
}

module.exports = { slotsForDay, loadMasterDay, datesWithSlots, assertSlotFree, assertResourceFree };
