export const RIDER_DESIGNS = [
  { id: 'paper', name: 'Бумага', bg: '#FFF9FA', ink: '#241B1F', accent: '#D9688A', radius: 28 },
  { id: 'night', name: 'Ночь', bg: '#241B1F', ink: '#F6EEEF', accent: '#E889A5', radius: 28 },
  { id: 'blush', name: 'Румянец', bg: '#FBECEF', ink: '#241B1F', accent: '#D9688A', radius: 32 },
  { id: 'magazine', name: 'Журнал', bg: '#FFFFFF', ink: '#241B1F', accent: '#241B1F', radius: 0 },
  { id: 'capsule', name: 'Капсула', bg: '#FFF9FA', ink: '#241B1F', accent: '#D9688A', radius: 999 },
  { id: 'cards', name: 'Карточки', bg: '#F6EEEF', ink: '#241B1F', accent: '#D9688A', radius: 28 },
  { id: 'line', name: 'Линия', bg: '#FFFFFF', ink: '#241B1F', accent: '#D9688A', radius: 0 },
  { id: 'quiet', name: 'Тишина', bg: '#FFF9FA', ink: '#241B1F', accent: '#6F6267', radius: 0 },
  { id: 'contrast', name: 'Контраст', bg: '#241B1F', ink: '#F6EEEF', accent: '#D9688A', radius: 16 },
  { id: 'silk', name: 'Шёлк', bg: '#FBECEF', ink: '#241B1F', accent: '#E889A5', radius: 32 },
];

export const QUESTION_TYPES = [
  ['TEXT', 'Короткий текст'],
  ['LONG', 'Большое поле'],
  ['PHONE', 'Телефон'],
  ['EMAIL', 'Почта'],
  ['NUMBER', 'Число'],
  ['DATE', 'Дата'],
  ['CHOICE', 'Один из списка'],
  ['MULTI', 'Несколько из списка'],
  ['LIST', 'Выпадающий список'],
  ['YESNO', 'Да или нет'],
];

export const COVER_BLOCKS = [
  ['eyebrow', 'Надпись сверху'],
  ['title', 'Заголовок'],
  ['text', 'Текст'],
  ['button', 'Кнопка'],
];

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

const COLOR_KEYS = ['bg', 'title', 'text', 'question', 'button', 'buttonText', 'choice'];

export function defaultLayout(designId = 'paper') {
  const colors = Object.fromEntries(COLOR_KEYS.map((key, index) => [key, (PALETTE[designId] || PALETTE.paper)[index]]));
  const theme = RIDER_DESIGNS.find((item) => item.id === designId) || RIDER_DESIGNS[0];
  return {
    eyebrow: 'Перед визитом',
    title: 'Заполните анкету для вашего удобства',
    text: 'Минута сейчас — и мастер встретит вас так, как вы любите: напиток, температура, тишина или разговор.',
    button: 'Заполнить',
    submit: 'Отправить в салон',
    thanksTitle: 'Спасибо',
    thanksText: 'Салон уже видит ваши пожелания.',
    align: 'left',
    place: 'cover',
    blocks: COVER_BLOCKS.map(([id]) => id),
    colors,
    radius: theme.radius > 40 ? 28 : theme.radius,
  };
}

export function mergeLayout(raw, designId = 'paper') {
  const base = defaultLayout(designId);
  const layout = raw && typeof raw === 'object' ? raw : {};
  const colors = { ...base.colors };
  for (const key of COLOR_KEYS) {
    if (/^#[0-9A-Fa-f]{6}$/.test(layout.colors?.[key] || '')) colors[key] = layout.colors[key];
  }
  const blocks = Array.isArray(layout.blocks) ? layout.blocks.filter((item) => base.blocks.includes(item)) : [...base.blocks];
  for (const block of base.blocks) if (!blocks.includes(block)) blocks.push(block);
  return {
    ...base,
    eyebrow: layout.eyebrow || base.eyebrow,
    title: layout.title || base.title,
    text: layout.text || base.text,
    button: layout.button || base.button,
    submit: layout.submit || base.submit,
    thanksTitle: layout.thanksTitle || base.thanksTitle,
    thanksText: layout.thanksText || base.thanksText,
    align: layout.align === 'center' ? 'center' : 'left',
    place: layout.place === 'split' ? 'split' : 'cover',
    blocks,
    colors,
    radius: Math.min(32, Math.max(0, Number(layout.radius ?? base.radius) || 0)),
  };
}

export function riderTheme(rider) {
  if (rider?.design === 'custom') {
    return {
      id: 'custom',
      name: 'Свой',
      bg: rider.customBg || '#FFF9FA',
      ink: rider.customInk || '#241B1F',
      accent: rider.customAccent || '#D9688A',
      radius: Number(rider.customRadius ?? 28),
    };
  }
  return RIDER_DESIGNS.find((item) => item.id === rider?.design) || RIDER_DESIGNS[0];
}
