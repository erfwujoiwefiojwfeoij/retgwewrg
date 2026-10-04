const { prisma } = require('../lib/prisma');

async function notify(userId, type, title, body, link) {
  if (!userId) return null;
  return prisma.notification.create({
    data: { userId, type, title, body, link },
  });
}

async function audit(userId, action, entity, entityId, meta) {
  return prisma.auditLog.create({
    data: { userId: userId || null, action, entity, entityId: entityId || null, meta: meta || undefined },
  });
}

async function recomputeRatings(masterId, salonId) {
  if (masterId) {
    const agg = await prisma.review.aggregate({
      where: { masterId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.master.update({
      where: { id: masterId },
      data: { rating: Number((agg._avg.rating || 0).toFixed(2)), reviewCount: agg._count },
    });
  }
  if (salonId) {
    const agg = await prisma.review.aggregate({
      where: { salonId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.salon.update({
      where: { id: salonId },
      data: { rating: Number((agg._avg.rating || 0).toFixed(2)), reviewCount: agg._count },
    });
  }
}

async function recomputePriceFrom(masterId, salonId) {
  if (masterId) {
    const links = await prisma.masterService.findMany({
      where: { masterId, service: { active: true } },
      include: { service: true },
    });
    const prices = links.map((link) => link.price ?? link.service.price);
    await prisma.master.update({
      where: { id: masterId },
      data: { priceFrom: prices.length ? Math.min(...prices) : 0 },
    });
  }
  if (salonId) {
    const services = await prisma.service.findMany({
      where: { salonId, active: true },
      select: { price: true },
    });
    await prisma.salon.update({
      where: { id: salonId },
      data: { priceFrom: services.length ? Math.min(...services.map((item) => item.price)) : 0 },
    });
  }
}

async function touchClient({ salonId, userId, name, phone, email }) {
  if (!salonId || !email) return;
  const crypto = require('crypto');
  await prisma.salonClient.upsert({
    where: { salonId_email: { salonId, email } },
    update: { name, phone, userId: userId || undefined },
    create: {
      salonId,
      userId: userId || null,
      name,
      phone,
      email,
      referralCode: crypto.randomBytes(3).toString('hex'),
    },
  });
}

module.exports = { notify, audit, recomputeRatings, recomputePriceFrom, touchClient };
