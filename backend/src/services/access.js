const { prisma } = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { salonAccess } = require('../middleware/auth');

async function workspace(user) {
  if (!user) throw new AppError(401, 'Нужно войти в аккаунт');
  if (user.role === 'SALON_OWNER' || user.role === 'SALON_ADMIN' || user.role === 'SUPER_ADMIN') {
    const owned = await prisma.salon.findFirst({
      where: { ownerId: user.id },
      include: { subscription: true, branches: true },
    });
    if (owned) return { type: 'salon', salon: owned, master: null };
    const member = await prisma.salonMember.findFirst({
      where: { userId: user.id },
      include: { salon: { include: { subscription: true, branches: true } } },
    });
    if (member) return { type: 'salon', salon: member.salon, master: null };
  }
  if (user.role === 'MASTER' || user.master) {
    const master = await prisma.master.findUnique({
      where: { userId: user.id },
      include: { salon: { include: { subscription: true, branches: true } } },
    });
    if (master) return { type: 'master', salon: master.salon, master };
  }
  const owned = await prisma.salon.findFirst({
    where: { ownerId: user.id },
    include: { subscription: true, branches: true },
  });
  if (owned) return { type: 'salon', salon: owned, master: null };
  return { type: 'none', salon: null, master: null };
}

async function assertMasterManage(user, masterId) {
  const master = await prisma.master.findUnique({ where: { id: masterId } });
  if (!master) throw new AppError(404, 'Мастер не найден');
  if (user.role === 'SUPER_ADMIN') return master;
  if (master.userId && master.userId === user.id) return master;
  if (master.salonId) {
    const salon = await salonAccess(user, master.salonId);
    if (salon) return master;
  }
  throw new AppError(403, 'Нет доступа к мастеру');
}

async function resolveServicePrice(masterId, serviceId) {
  const link = await prisma.masterService.findUnique({
    where: { masterId_serviceId: { masterId, serviceId } },
    include: { service: true },
  });
  if (!link || !link.service.active) throw new AppError(400, 'Услуга недоступна у этого мастера');
  return {
    link,
    price: link.price ?? link.service.price,
    durationMin: link.durationMin || link.service.durationMin,
    service: link.service,
  };
}

module.exports = { workspace, assertMasterManage, resolveServicePrice };
