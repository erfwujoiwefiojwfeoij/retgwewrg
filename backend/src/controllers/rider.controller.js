const { prisma } = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { workspace } = require('../services/access');
const { uniqueSlug } = require('../utils/slug');

const DESIGNS = ['paper', 'night', 'blush', 'magazine', 'capsule', 'cards', 'line', 'quiet', 'contrast', 'silk', 'custom'];
const TYPES = ['TEXT', 'LONG', 'PHONE', 'EMAIL', 'NUMBER', 'DATE', 'CHOICE', 'MULTI', 'LIST', 'YESNO'];
const CHOICE = new Set(['CHOICE', 'MULTI', 'LIST']);

const TEMPLATE = [
  { label: 'Как к вам обращаться', type: 'TEXT', required: true },
  { label: 'Телефон', type: 'PHONE', required: true },
  { label: 'Напиток', type: 'CHOICE', required: false, options: ['Вода', 'Кофе', 'Чай', 'Ничего'] },
  { label: 'Температура в кабинете', type: 'CHOICE', required: false, options: ['Теплее', 'Как есть', 'Прохладнее'] },
  { label: 'Общение', type: 'CHOICE', required: false, options: ['Поговорить', 'Тишина', 'Как пойдёт'] },
  { label: 'Музыка', type: 'LIST', required: false, options: ['Спокойная', 'Без музыки', 'Своя'] },
  { label: 'Аллергии и важные ограничения', type: 'LONG', required: false },
  { label: 'Что сделает визит идеальным', type: 'LONG', required: false },
  { label: 'Согласие на обработку данных для этой анкеты', type: 'YESNO', required: true },
];

function present(rider) {
  return {
    ...rider,
    questions: [...rider.questions].sort((a, b) => a.sort - b.sort),
  };
}

async function salonOf(user) {
  const space = await workspace(user);
  if (!space.salon || space.type !== 'salon') throw new AppError(403, 'Райдер настраивает салон');
  return space.salon;
}

function cleanQuestions(questions) {
  if (!Array.isArray(questions) || !questions.length) throw new AppError(400, 'Добавьте хотя бы один вопрос');
  if (questions.length > 30) throw new AppError(400, 'В райдере не больше 30 вопросов');
  return questions.map((question, index) => {
    const label = String(question.label || '').trim();
    const type = String(question.type || '');
    if (label.length < 2 || label.length > 160) throw new AppError(400, 'Проверьте подписи вопросов');
    if (!TYPES.includes(type)) throw new AppError(400, 'Неизвестный тип вопроса');
    const options = (question.options || []).map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
    if (CHOICE.has(type) && options.length < 2) throw new AppError(400, `У вопроса «${label}» нужно минимум два варианта`);
    return {
      label,
      help: String(question.help || '').trim() || null,
      type,
      required: Boolean(question.required),
      options: CHOICE.has(type) ? options : [],
      sort: index,
    };
  });
}

const COVER_BLOCKS = ['eyebrow', 'title', 'text', 'button'];
const COLOR_KEYS = ['bg', 'title', 'text', 'question', 'button', 'buttonText', 'choice'];
const PALETTE = {
  paper: ['#FFF9FA', '#241B1F', '#6F6267', '#241B1F', '#D9688A', '#FFFFFF', '#D9688A'],
  night: ['#241B1F', '#F6EEEF', '#C8B8BD', '#F6EEEF', '#E889A5', '#241B1F', '#E889A5'],
  blush: ['#FBECEF', '#241B1F', '#6F6267', '#241B1F', '#D9688A', '#FFFFFF', '#D9688A'],
  magazine: ['#FFFFFF', '#241B1F', '#6F6267', '#241B1F', '#241B1F', '#FFFFFF', '#241B1F'],
  capsule: ['#FFF9FA', '#241B1F', '#6F6267', '#241B1F', '#D9688A', '#FFFFFF', '#D9688A'],
  cards: ['#F6EEEF', '#241B1F', '#6F6267', '#241B1F', '#D9688A', '#FFFFFF', '#D9688A'],
  line: ['#FFFFFF', '#241B1F', '#6F6267', '#241B1F', '#D9688A', '#FFFFFF', '#D9688A'],
  quiet: ['#FFF9FA', '#241B1F', '#6F6267', '#241B1F', '#6F6267', '#FFFFFF', '#6F6267'],
  contrast: ['#241B1F', '#F6EEEF', '#C8B8BD', '#F6EEEF', '#D9688A', '#FFFFFF', '#D9688A'],
  silk: ['#FBECEF', '#241B1F', '#6F6267', '#241B1F', '#E889A5', '#241B1F', '#E889A5'],
};

function clip(value, max, fallback) {
  const text = String(value ?? '').trim();
  return (text || fallback).slice(0, max);
}

function cleanLayout(body) {
  const raw = body.layout && typeof body.layout === 'object' ? body.layout : {};
  const preset = PALETTE[body.design] || PALETTE.paper;
  const colors = {};
  COLOR_KEYS.forEach((key, index) => {
    const value = raw.colors?.[key];
    colors[key] = /^#[0-9A-Fa-f]{6}$/.test(value || '') ? value : preset[index];
  });
  const blocks = Array.isArray(raw.blocks) ? raw.blocks.filter((item) => COVER_BLOCKS.includes(item)) : [...COVER_BLOCKS];
  for (const block of COVER_BLOCKS) if (!blocks.includes(block)) blocks.push(block);
  return {
    eyebrow: clip(raw.eyebrow, 80, 'Перед визитом'),
    title: clip(raw.title, 160, 'Заполните анкету для вашего удобства'),
    text: clip(raw.text, 500, 'Минута сейчас — и мастер встретит вас так, как вы любите.'),
    button: clip(raw.button, 40, 'Заполнить'),
    submit: clip(raw.submit, 40, 'Отправить в салон'),
    thanksTitle: clip(raw.thanksTitle, 80, 'Спасибо'),
    thanksText: clip(raw.thanksText, 240, 'Салон уже видит ваши пожелания.'),
    align: raw.align === 'center' ? 'center' : 'left',
    place: raw.place === 'split' ? 'split' : 'cover',
    blocks,
    colors,
    radius: Math.min(32, Math.max(0, Number(raw.radius) || 28)),
  };
}

function cleanDesign(body) {
  const design = DESIGNS.includes(body.design) ? body.design : 'paper';
  const hex = /^#[0-9A-Fa-f]{6}$/;
  const colors = body.layout?.colors || {};
  return {
    design,
    customBg: hex.test(colors.bg || '') ? colors.bg : (hex.test(body.customBg || '') ? body.customBg : null),
    customInk: hex.test(colors.title || '') ? colors.title : (hex.test(body.customInk || '') ? body.customInk : null),
    customAccent: hex.test(colors.button || '') ? colors.button : (hex.test(body.customAccent || '') ? body.customAccent : null),
    customRadius: Math.min(32, Math.max(0, Number(body.layout?.radius ?? body.customRadius) || 28)),
  };
}

async function list(req, res) {
  const salon = await salonOf(req.user);
  const rows = await prisma.rider.findMany({
    where: { salonId: salon.id },
    include: { questions: true, _count: { select: { answers: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: rows.map((row) => ({ ...present(row), answers: row._count.answers })) });
}

async function create(req, res) {
  const salon = await salonOf(req.user);
  const title = String(req.body.title || 'Райдер визита').trim();
  if (title.length < 2) throw new AppError(400, 'Нужно название');
  const questions = req.body.template ? TEMPLATE : cleanQuestions(req.body.questions);
  const design = cleanDesign(req.body);
  const layout = cleanLayout(req.body);
  const slug = await uniqueSlug('rider', `${salon.slug}-${title}`);
  const rider = await prisma.rider.create({
    data: {
      salonId: salon.id,
      slug,
      title,
      intro: String(req.body.intro || layout.text).trim(),
      published: req.body.published !== false,
      ...design,
      layout,
      questions: { create: questions },
    },
    include: { questions: true },
  });
  res.status(201).json({ data: present(rider) });
}

async function update(req, res) {
  const salon = await salonOf(req.user);
  const rider = await prisma.rider.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!rider) throw new AppError(404, 'Райдер не найден');
  const questions = cleanQuestions(req.body.questions);
  const design = cleanDesign(req.body);
  const layout = cleanLayout(req.body);
  await prisma.riderQuestion.deleteMany({ where: { riderId: rider.id } });
  const updated = await prisma.rider.update({
    where: { id: rider.id },
    data: {
      title: String(req.body.title || rider.title).trim(),
      intro: String(req.body.intro || layout.text).trim(),
      published: Boolean(req.body.published),
      ...design,
      layout,
      questions: { create: questions },
    },
    include: { questions: true },
  });
  res.json({ data: present(updated) });
}

async function remove(req, res) {
  const salon = await salonOf(req.user);
  const rider = await prisma.rider.findFirst({ where: { id: req.params.id, salonId: salon.id } });
  if (!rider) throw new AppError(404, 'Райдер не найден');
  await prisma.rider.delete({ where: { id: rider.id } });
  res.json({ data: { ok: true } });
}

async function answers(req, res) {
  const salon = await salonOf(req.user);
  const rider = await prisma.rider.findFirst({ where: { id: req.params.id, salonId: salon.id }, include: { questions: true } });
  if (!rider) throw new AppError(404, 'Райдер не найден');
  const rows = await prisma.riderAnswer.findMany({ where: { riderId: rider.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  await prisma.riderAnswer.updateMany({ where: { riderId: rider.id, read: false }, data: { read: true } });
  res.json({ data: rows, rider: present(rider) });
}

async function publicRider(req, res) {
  const rider = await prisma.rider.findUnique({ where: { slug: req.params.slug }, include: { questions: true, salon: { select: { name: true, city: true } } } });
  if (!rider || !rider.published) throw new AppError(404, 'Райдер не найден');
  res.json({
    data: {
      slug: rider.slug,
      title: rider.title,
      intro: rider.intro,
      design: rider.design,
      customBg: rider.customBg,
      customInk: rider.customInk,
      customAccent: rider.customAccent,
      customRadius: rider.customRadius,
      layout: rider.layout,
      salon: rider.salon,
      questions: present(rider).questions.map((question) => ({
        id: question.id,
        label: question.label,
        help: question.help,
        type: question.type,
        required: question.required,
        options: question.options,
      })),
    },
  });
}

function answerValue(question, raw) {
  if (question.type === 'MULTI') {
    const values = Array.isArray(raw) ? raw.map((item) => String(item)) : [];
    const allowed = values.filter((item) => question.options.includes(item));
    if (question.required && !allowed.length) throw new AppError(400, `Заполните «${question.label}»`);
    return allowed;
  }
  if (question.type === 'YESNO') {
    if (raw !== 'yes' && raw !== 'no') {
      if (question.required) throw new AppError(400, `Ответьте на «${question.label}»`);
      return '';
    }
    return raw;
  }
  const value = String(raw ?? '').trim();
  if (question.required && !value) throw new AppError(400, `Заполните «${question.label}»`);
  if (question.type === 'PHONE' && value && value.replace(/\D/g, '').length < 6) throw new AppError(400, `Проверьте телефон в «${question.label}»`);
  if (question.type === 'EMAIL' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new AppError(400, `Проверьте почту в «${question.label}»`);
  if (CHOICE.has(question.type) && value && !question.options.includes(value)) throw new AppError(400, `Выберите вариант в «${question.label}»`);
  return value;
}

async function submit(req, res) {
  const rider = await prisma.rider.findUnique({ where: { slug: req.params.slug }, include: { questions: true } });
  if (!rider || !rider.published) throw new AppError(404, 'Райдер не найден');
  const incoming = req.body.answers || {};
  const payload = rider.questions
    .sort((a, b) => a.sort - b.sort)
    .map((question) => ({
      questionId: question.id,
      label: question.label,
      type: question.type,
      value: answerValue(question, incoming[question.id]),
    }));
  const nameField = payload.find((item) => item.type === 'TEXT' && item.value);
  const phoneField = payload.find((item) => item.type === 'PHONE' && item.value);
  const answer = await prisma.riderAnswer.create({
    data: {
      riderId: rider.id,
      clientName: String(req.body.clientName || nameField?.value || 'Клиент').trim().slice(0, 80),
      clientPhone: phoneField?.value ? String(phoneField.value).slice(0, 24) : null,
      payload,
    },
  });
  res.status(201).json({ data: { id: answer.id } });
}

module.exports = { list, create, update, remove, answers, publicRider, submit, DESIGNS };
