function parseMinutes(value) {
  const [h, m] = String(value).split(':').map(Number);
  return h * 60 + m;
}

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function atMoscow(dateStr, minutes) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return new Date(`${dateStr}T${hh}:${mm}:00+03:00`);
}

function weekdayMoscow(dateStr) {
  return new Date(`${dateStr}T12:00:00+03:00`).getUTCDay();
}

function dateStringMoscow(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T12:00:00+03:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayMoscow() {
  return dateStringMoscow(new Date());
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

module.exports = {
  parseMinutes,
  formatMinutes,
  atMoscow,
  weekdayMoscow,
  dateStringMoscow,
  addDays,
  todayMoscow,
  rangesOverlap,
};
