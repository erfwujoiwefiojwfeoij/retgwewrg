const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { workspace } = require('../services/access');
const { sendMail, appLink } = require('../utils/mailer');
const { publicId, staffPassword } = require('../utils/crypto');
const { uniqueStaffLogin } = require('../utils/staff');
const { notify } = require('../services/notify');

async function salonOf(user) {
  const space = await workspace(user);
  if (!space.salon || space.type !== 'salon') throw new AppError(403, 'Раздел доступен салону');
  return space.salon;
}

async function ensureDesk(salonId) {
  return prisma.salonDesk.upsert({
    where: { salonId },
    update: {},
    create: { salonId, channels: ['EMAIL'] },
  });
}

async function ensureAccounts(salonId) {
  const existing = await prisma.moneyAccount.findMany({ where: { salonId }, orderBy: { name: 'asc' } });
  if (existing.length) return existing;
  await prisma.moneyAccount.createMany({
    data: [
      { salonId, name: 'Касса', kind: 'CASH' },
      { salonId, name: 'Эквайринг', kind: 'CARD' },
      { salonId, name: 'Расчётный счёт', kind: 'BANK' },
    ],
  });
  return prisma.moneyAccount.findMany({ where: { salonId }, orderBy: { name: 'asc' } });
}

function accountKind(method) {
  if (method === 'CARD') return 'CARD';
  if (method === 'TRANSFER') return 'BANK';
  return 'CASH';
}

async function resources(req, res) {
  const salon = await salonOf(req.user);
  const rows = await prisma.resource.findMany({ where: { salonId: salon.id }, orderBy: { name: 'asc' } });
  res.json({ data: rows });
}

async function createResource(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.resource.create({
    data: { salonId: salon.id, name: req.body.name, kind: req.body.kind },
  });
  res.status(201).json({ data: row });
}

async function removeResource(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.resource.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!row) throw new AppError(404, 'Ресурс не найден');
  await prisma.resource.delete({ where: { id: row.id } });
  res.json({ data: { ok: true } });
}

async function addPhoto(req, res) {
  const salon = await salonOf(req.user);
  const client = await prisma.salonClient.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!client) throw new AppError(404, 'Клиент не найден');
  const photo = await prisma.clientPhoto.create({
    data: { clientId: client.id, url: req.body.url, caption: req.body.caption || null },
  });
  res.status(201).json({ data: photo });
}

async function removePhoto(req, res) {
  const salon = await salonOf(req.user);
  const photo = await prisma.clientPhoto.findUnique({ where: { id: req.params.id }, include: { client: true } });
  if (!photo || photo.client.salonId !== salon.id) throw new AppError(404, 'Фото не найдено');
  await prisma.clientPhoto.delete({ where: { id: photo.id } });
  res.json({ data: { ok: true } });
}

async function products(req, res) {
  const salon = await salonOf(req.user);
  const rows = await prisma.product.findMany({ where: { salonId: salon.id }, orderBy: { name: 'asc' } });
  res.json({ data: rows });
}

async function createProduct(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.product.create({
    data: {
      salonId: salon.id,
      name: req.body.name,
      unit: req.body.unit || 'шт',
      price: req.body.price,
      cost: req.body.cost || 0,
      stock: req.body.stock || 0,
      minStock: req.body.minStock || 0,
    },
  });
  res.status(201).json({ data: row });
}

async function moveStock(req, res) {
  const salon = await salonOf(req.user);
  const product = await prisma.product.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!product) throw new AppError(404, 'Товар не найден');
  const next = product.stock + req.body.qty;
  if (next < 0) throw new AppError(400, 'На складе не хватает остатка');
  const [updated] = await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { stock: next } }),
    prisma.stockMove.create({ data: { productId: product.id, qty: req.body.qty, reason: req.body.reason } }),
  ]);
  res.json({ data: updated });
}

async function finance(req, res) {
  const salon = await salonOf(req.user);
  const accounts = await ensureAccounts(salon.id);
  const entries = await prisma.ledgerEntry.findMany({
    where: { salonId: salon.id },
    include: { account: true },
    orderBy: { createdAt: 'desc' },
    take: 80,
  });
  const income = entries.filter((item) => item.kind === 'INCOME').reduce((sum, item) => sum + item.amount, 0);
  const expense = entries.filter((item) => item.kind === 'EXPENSE').reduce((sum, item) => sum + item.amount, 0);
  res.json({ data: { accounts, entries, income, expense } });
}

async function addLedger(req, res) {
  const salon = await salonOf(req.user);
  const account = await prisma.moneyAccount.findFirst({ where: { id: req.body.accountId, salonId: salon.id } });
  if (!account) throw new AppError(400, 'Счёт не найден');
  const row = await prisma.ledgerEntry.create({
    data: {
      salonId: salon.id,
      accountId: account.id,
      kind: req.body.kind,
      amount: req.body.amount,
      category: req.body.category,
      note: req.body.note || null,
    },
  });
  res.status(201).json({ data: row });
}

async function sales(req, res) {
  const salon = await salonOf(req.user);
  const rows = await prisma.sale.findMany({
    where: { salonId: salon.id },
    include: { lines: true, client: true },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });
  res.json({ data: rows });
}

async function createSale(req, res) {
  const salon = await salonOf(req.user);
  const lines = req.body.lines.filter((line) => line.title && line.qty > 0);
  if (!lines.length) throw new AppError(400, 'Добавьте хотя бы одну позицию');
  const total = lines.reduce((sum, line) => sum + line.qty * line.price, 0);
  const tip = req.body.tip || 0;
  let client = null;
  if (req.body.clientId) {
    client = await prisma.salonClient.findFirst({ where: { id: req.body.clientId, salonId: salon.id } });
    if (!client) throw new AppError(404, 'Клиент не найден');
  }
  if (req.body.method === 'CERTIFICATE') {
    const certificate = await prisma.certificate.findFirst({ where: { code: req.body.certificateCode, salonId: salon.id, active: true } });
    if (!certificate || certificate.balance < total) throw new AppError(400, 'Сертификата не хватает');
    await prisma.certificate.update({ where: { id: certificate.id }, data: { balance: certificate.balance - total } });
  }
  if (req.body.method === 'ABONEMENT') {
    const card = await prisma.abonement.findFirst({ where: { id: req.body.abonementId, client: { salonId: salon.id } } });
    if (!card || card.visitsLeft < 1 || card.expiresAt < new Date()) throw new AppError(400, 'Абонемент недоступен');
    await prisma.abonement.update({ where: { id: card.id }, data: { visitsLeft: card.visitsLeft - 1 } });
  }
  if (req.body.method === 'DEPOSIT') {
    if (!client || client.deposit < total + tip) throw new AppError(400, 'На депозите не хватает');
    await prisma.salonClient.update({ where: { id: client.id }, data: { deposit: { decrement: total + tip } } });
  }
  if (req.body.method === 'BONUS') {
    if (!client || client.bonusBalance < total) throw new AppError(400, 'Бонусов не хватает');
    await prisma.salonClient.update({ where: { id: client.id }, data: { bonusBalance: client.bonusBalance - total } });
  }
  const desk = await ensureDesk(salon.id);
  const sale = await prisma.sale.create({
    data: {
      salonId: salon.id,
      clientId: client?.id || null,
      total,
      tip,
      method: req.body.method,
      receipt: publicId(),
      lines: { create: lines.map((line) => ({ title: line.title, qty: line.qty, price: line.price, productId: line.productId || null })) },
    },
    include: { lines: true },
  });
  for (const line of lines) {
    if (!line.productId) continue;
    const product = await prisma.product.findFirst({ where: { id: line.productId, salonId: salon.id } });
    if (!product) continue;
    const next = Math.max(0, product.stock - line.qty);
    await prisma.product.update({ where: { id: product.id }, data: { stock: next } });
    await prisma.stockMove.create({ data: { productId: product.id, qty: -line.qty, reason: `Продажа ${sale.receipt}` } });
  }
  if (['CASH', 'CARD', 'TRANSFER'].includes(req.body.method)) {
    const accounts = await ensureAccounts(salon.id);
    const account = accounts.find((item) => item.kind === accountKind(req.body.method)) || accounts[0];
    await prisma.ledgerEntry.create({
      data: { salonId: salon.id, accountId: account.id, kind: 'INCOME', amount: total + tip, category: 'Продажа', note: sale.receipt },
    });
    if (client && desk.bonusPercent > 0) {
      const bonus = Math.floor((total * desk.bonusPercent) / 100);
      if (bonus > 0) await prisma.salonClient.update({ where: { id: client.id }, data: { bonusBalance: { increment: bonus } } });
    }
  }
  res.status(201).json({ data: sale });
}

async function certificates(req, res) {
  const salon = await salonOf(req.user);
  const rows = await prisma.certificate.findMany({ where: { salonId: salon.id }, orderBy: { code: 'asc' } });
  res.json({ data: rows });
}

async function createCertificate(req, res) {
  const salon = await salonOf(req.user);
  const code = `LN${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const row = await prisma.certificate.create({
    data: { salonId: salon.id, code, amount: req.body.amount, balance: req.body.amount, buyerName: req.body.buyerName || null },
  });
  const accounts = await ensureAccounts(salon.id);
  const cash = accounts.find((item) => item.kind === 'CASH');
  await prisma.ledgerEntry.create({
    data: { salonId: salon.id, accountId: cash.id, kind: 'INCOME', amount: req.body.amount, category: 'Сертификат', note: code },
  });
  res.status(201).json({ data: row });
}

async function plans(req, res) {
  const salon = await salonOf(req.user);
  const rows = await prisma.abonementPlan.findMany({
    where: { salonId: salon.id },
    include: { cards: { include: { client: true } } },
  });
  res.json({ data: rows });
}

async function createPlan(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.abonementPlan.create({
    data: { salonId: salon.id, name: req.body.name, visits: req.body.visits, price: req.body.price, days: req.body.days || 90 },
  });
  res.status(201).json({ data: row });
}

async function sellPlan(req, res) {
  const salon = await salonOf(req.user);
  const plan = await prisma.abonementPlan.findFirst({ where: { id: req.body.planId, salonId: salon.id } });
  const client = await prisma.salonClient.findFirst({ where: { id: req.body.clientId, salonId: salon.id } });
  if (!plan || !client) throw new AppError(404, 'План или клиент не найден');
  const expiresAt = new Date(Date.now() + plan.days * 86400000);
  const card = await prisma.abonement.create({
    data: { planId: plan.id, clientId: client.id, visitsLeft: plan.visits, expiresAt },
  });
  const accounts = await ensureAccounts(salon.id);
  const cash = accounts.find((item) => item.kind === 'CASH');
  await prisma.ledgerEntry.create({
    data: { salonId: salon.id, accountId: cash.id, kind: 'INCOME', amount: plan.price, category: 'Абонемент', note: `${plan.name} · ${client.name}` },
  });
  res.status(201).json({ data: card });
}

async function payroll(req, res) {
  const salon = await salonOf(req.user);
  const masters = await prisma.master.findMany({
    where: { salonId: salon.id },
    include: { payroll: true },
    orderBy: { firstName: 'asc' },
  });
  res.json({ data: masters.map((master) => ({ id: master.id, firstName: master.firstName, lastName: master.lastName, payroll: master.payroll })) });
}

async function savePayroll(req, res) {
  const salon = await salonOf(req.user);
  const master = await prisma.master.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!master) throw new AppError(404, 'Мастер не найден');
  const row = await prisma.payrollScheme.upsert({
    where: { masterId: master.id },
    update: { percent: req.body.percent, fixed: req.body.fixed },
    create: { masterId: master.id, percent: req.body.percent, fixed: req.body.fixed },
  });
  res.json({ data: row });
}

async function runPayroll(req, res) {
  const salon = await salonOf(req.user);
  const master = await prisma.master.findFirst({ where: { id: req.body.masterId, salonId: salon.id }, include: { payroll: true } });
  if (!master) throw new AppError(404, 'Мастер не найден');
  const scheme = master.payroll || { percent: 40, fixed: 0 };
  const from = new Date(req.body.from);
  const to = new Date(req.body.to);
  const done = await prisma.booking.findMany({
    where: { masterId: master.id, status: 'COMPLETED', startAt: { gte: from, lte: to } },
  });
  const base = done.reduce((sum, item) => sum + item.price, 0);
  const amount = Math.round((base * scheme.percent) / 100) + scheme.fixed;
  const accounts = await ensureAccounts(salon.id);
  const cash = accounts.find((item) => item.kind === 'CASH');
  await prisma.ledgerEntry.create({
    data: {
      salonId: salon.id,
      accountId: cash.id,
      kind: 'EXPENSE',
      amount,
      category: 'Зарплата',
      note: `${master.firstName} ${master.lastName}`,
    },
  });
  res.status(201).json({ data: { amount, visits: done.length, base } });
}

async function channels(req, res) {
  const salon = await salonOf(req.user);
  const desk = await ensureDesk(salon.id);
  const outbox = await prisma.outbox.findMany({ where: { salonId: salon.id }, orderBy: { createdAt: 'desc' }, take: 30 });
  const calls = await prisma.callLog.findMany({ where: { salonId: salon.id }, orderBy: { createdAt: 'desc' }, take: 20 });
  res.json({ data: { desk, salon: { slug: salon.slug, name: salon.name }, outbox, calls } });
}

async function saveChannels(req, res) {
  const salon = await salonOf(req.user);
  await ensureDesk(salon.id);
  const desk = await prisma.salonDesk.update({
    where: { salonId: salon.id },
    data: {
      yandexUrl: req.body.yandexUrl || null,
      googleUrl: req.body.googleUrl || null,
      sip: req.body.sip || null,
      bonusPercent: req.body.bonusPercent,
      referralBonus: req.body.referralBonus,
      channels: req.body.channels,
    },
  });
  res.json({ data: desk });
}

async function addCall(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.callLog.create({
    data: { salonId: salon.id, phone: req.body.phone, name: req.body.name || null, note: req.body.note || null },
  });
  res.status(201).json({ data: row });
}

async function outreach(req, res) {
  const salon = await salonOf(req.user);
  const client = await prisma.salonClient.findFirst({ where: { id: req.body.clientId, salonId: salon.id } });
  if (!client) throw new AppError(404, 'Клиент не найден');
  if (req.body.kind === 'return' && !client.consentAds) throw new AppError(400, 'Нет согласия на рассылку');
  const rider = req.body.riderSlug ? `${appLink(`/r/${req.body.riderSlug}`)}` : '';
  const text = {
    reminder: `Напоминаем о визите в ${salon.name}. ${rider}`.trim(),
    review: `Как прошёл визит в ${salon.name}? Будем рады короткому отзыву.`,
    return: `${client.name}, будем рады видеть вас снова в ${salon.name}.`,
    rider: `${client.name}, заполните райдер перед визитом: ${rider}`,
  }[req.body.kind];
  if (!text) throw new AppError(400, 'Неизвестный тип сообщения');
  const row = await prisma.outbox.create({
    data: {
      salonId: salon.id,
      channel: req.body.channel,
      kind: req.body.kind,
      body: text,
      phone: client.phone,
      status: req.body.channel === 'EMAIL' ? 'SENT' : 'QUEUED',
    },
  });
  if (req.body.channel === 'EMAIL' && client.email) {
    await sendMail({ to: client.email, subject: salon.name, text, link: rider || appLink('/dashboard/appointments') });
  }
  if (client.userId && req.body.kind === 'review') {
    await notify(client.userId, 'REVIEW_REQUEST', 'Как прошёл визит?', text, '/dashboard/appointments');
  }
  res.status(201).json({ data: row });
}

async function markOutbox(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.outbox.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!row) throw new AppError(404, 'Сообщение не найдено');
  const updated = await prisma.outbox.update({ where: { id: row.id }, data: { status: 'SENT' } });
  res.json({ data: updated });
}

async function chat(req, res) {
  const space = await workspace(req.user);
  if (!space.salon) throw new AppError(403, 'Чат доступен команде салона');
  const salon = space.salon;
  const rows = await prisma.staffMessage.findMany({
    where: { salonId: salon.id },
    include: { author: { include: { profile: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  res.json({
    data: rows.map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.createdAt,
      author: row.author.profile ? `${row.author.profile.firstName} ${row.author.profile.lastName}` : row.author.email,
    })),
  });
}

async function postChat(req, res) {
  const space = await workspace(req.user);
  if (!space.salon) throw new AppError(403, 'Чат доступен команде салона');
  const salon = space.salon;
  const row = await prisma.staffMessage.create({
    data: { salonId: salon.id, authorId: req.user.id, body: req.body.body },
  });
  res.status(201).json({ data: row });
}

async function members(req, res) {
  const salon = await salonOf(req.user);
  const rows = await prisma.salonMember.findMany({
    where: { salonId: salon.id },
    include: { user: { include: { profile: true } } },
  });
  res.json({
    data: rows.map((row) => ({
      id: row.id,
      role: row.role,
      email: row.user.email,
      name: row.user.profile ? `${row.user.profile.firstName} ${row.user.profile.lastName}` : row.user.email,
    })),
  });
}

async function createMember(req, res) {
  const salon = await salonOf(req.user);
  const password = staffPassword();
  const passwordHash = await bcrypt.hash(password, 12);
  const { login, email } = await uniqueStaffLogin(req.body.firstName, req.body.lastName);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'SALON_ADMIN',
      emailVerified: true,
      profile: { create: { firstName: req.body.firstName, lastName: req.body.lastName, city: salon.city } },
      memberships: { create: { salonId: salon.id, role: 'SALON_ADMIN' } },
    },
  });
  res.status(201).json({ data: { id: user.id, login, password } });
}

async function addFormula(req, res) {
  const salon = await salonOf(req.user);
  const client = await prisma.salonClient.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!client) throw new AppError(404, 'Клиент не найден');
  const row = await prisma.visitFormula.create({
    data: { clientId: client.id, title: req.body.title, body: req.body.body },
  });
  res.status(201).json({ data: row });
}

async function topUpDeposit(req, res) {
  const salon = await salonOf(req.user);
  const client = await prisma.salonClient.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!client) throw new AppError(404, 'Клиент не найден');
  const updated = await prisma.salonClient.update({
    where: { id: client.id },
    data: { deposit: { increment: req.body.amount } },
  });
  const accounts = await ensureAccounts(salon.id);
  const cash = accounts.find((item) => item.kind === 'CASH');
  await prisma.ledgerEntry.create({
    data: { salonId: salon.id, accountId: cash.id, kind: 'INCOME', amount: req.body.amount, category: 'Депозит', note: client.name },
  });
  res.json({ data: { deposit: updated.deposit } });
}

async function waitlist(req, res) {
  const salon = await salonOf(req.user);
  const rows = await prisma.waitEntry.findMany({ where: { salonId: salon.id }, orderBy: { createdAt: 'desc' }, take: 80 });
  res.json({ data: rows });
}

async function createWait(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.waitEntry.create({
    data: {
      salonId: salon.id,
      name: req.body.name,
      phone: req.body.phone,
      serviceName: req.body.serviceName,
      wishDate: req.body.wishDate ? new Date(`${req.body.wishDate}T00:00:00.000Z`) : null,
      note: req.body.note || null,
    },
  });
  res.status(201).json({ data: row });
}

async function patchWait(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.waitEntry.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!row) throw new AppError(404, 'Заявка не найдена');
  const updated = await prisma.waitEntry.update({ where: { id: row.id }, data: { status: req.body.status } });
  res.json({ data: updated });
}

async function closures(req, res) {
  const salon = await salonOf(req.user);
  const rows = await prisma.salonClosure.findMany({ where: { salonId: salon.id }, orderBy: { date: 'asc' } });
  res.json({ data: rows });
}

async function createClosure(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.salonClosure.create({
    data: { salonId: salon.id, date: new Date(`${req.body.date}T00:00:00.000Z`), reason: req.body.reason || null },
  });
  res.status(201).json({ data: row });
}

async function removeClosure(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.salonClosure.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!row) throw new AppError(404, 'День не найден');
  await prisma.salonClosure.delete({ where: { id: row.id } });
  res.json({ data: { ok: true } });
}

async function removeMember(req, res) {
  const salon = await salonOf(req.user);
  const row = await prisma.salonMember.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!row) throw new AppError(404, 'Администратор не найден');
  await prisma.salonMember.delete({ where: { id: row.id } });
  res.json({ data: { ok: true } });
}

module.exports = {
  resources,
  createResource,
  removeResource,
  addPhoto,
  removePhoto,
  products,
  createProduct,
  moveStock,
  finance,
  addLedger,
  sales,
  createSale,
  certificates,
  createCertificate,
  plans,
  createPlan,
  sellPlan,
  payroll,
  savePayroll,
  runPayroll,
  channels,
  saveChannels,
  addCall,
  outreach,
  markOutbox,
  chat,
  postChat,
  members,
  createMember,
  removeMember,
  addFormula,
  topUpDeposit,
  waitlist,
  createWait,
  patchWait,
  closures,
  createClosure,
  removeClosure,
};
