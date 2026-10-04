const { prisma } = require('../lib/prisma');
const { notify } = require('./notify');
const { sendMail } = require('../utils/mailer');

async function sendReminders() {
  const from = new Date(Date.now() + 20 * 60 * 60 * 1000);
  const to = new Date(Date.now() + 28 * 60 * 60 * 1000);
  const bookings = await prisma.booking.findMany({
    where: { status: { in: ['PENDING', 'CONFIRMED'] }, startAt: { gte: from, lte: to }, clientId: { not: null } },
    include: { service: true, salon: true },
  });
  for (const booking of bookings) {
    const link = `/dashboard/appointments?id=${booking.id}`;
    const exists = await prisma.notification.findFirst({
      where: { userId: booking.clientId, type: 'BOOKING_REMINDER', link },
    });
    if (exists) continue;
    await notify(booking.clientId, 'BOOKING_REMINDER', 'Завтра запись', `${booking.service.name} · ${booking.publicId}`, link);
    if (!booking.salonId) continue;
    const desk = await prisma.salonDesk.findUnique({ where: { salonId: booking.salonId } });
    const channels = desk?.channels?.length ? desk.channels : ['EMAIL'];
    const rider = await prisma.rider.findFirst({ where: { salonId: booking.salonId, published: true }, orderBy: { createdAt: 'desc' } });
    const riderLink = rider ? ` Райдер: /r/${rider.slug}` : '';
    const body = `Завтра ${booking.service.name} в ${booking.salon?.name || 'салоне'}.${riderLink}`;
    for (const channel of channels) {
      await prisma.outbox.create({
        data: {
          salonId: booking.salonId,
          channel,
          kind: 'reminder',
          body,
          phone: booking.clientPhone,
          status: channel === 'EMAIL' ? 'SENT' : 'QUEUED',
        },
      });
    }
    if (channels.includes('EMAIL') && booking.clientEmail) {
      await sendMail({ to: booking.clientEmail, subject: 'Завтра запись', text: body, link });
    }
  }
}

module.exports = { sendReminders };
