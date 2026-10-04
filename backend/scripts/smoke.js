const base = 'http://127.0.0.1:4000';
const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
}

async function call(path, options = {}) {
  const headers = { ...(options.body ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}) };
  if (cookieHeader()) headers.cookie = cookieHeader();
  if (options.method && options.method !== 'GET') {
    const csrf = jar.get('csrf_token');
    if (csrf) headers['x-csrf-token'] = csrf;
  }
  const response = await fetch(`${base}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  for (const cookie of response.headers.getSetCookie?.() || []) {
    const [pair] = cookie.split(';');
    const index = pair.indexOf('=');
    jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`${options.method || 'GET'} ${path} -> ${response.status} ${payload.error?.message || ''}`);
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function main() {
  await call('/api/auth/csrf');
  const home = await call('/api/home');
  if (!home.data.featured) throw new Error('no featured salon');
  const login = await call('/api/auth/login', { method: 'POST', body: { email: 'client@lunea.test', password: 'LuneaDemo2026!' } });
  if (login.data.role !== 'CLIENT') throw new Error('client role');
  const salon = await call(`/api/salons/${home.data.featured.slug}`);
  const master = salon.data.masters[0];
  const service = salon.data.services[0];
  const dates = await call(`/api/availability?masterId=${master.id}&serviceId=${service.id}`);
  if (!dates.data.dates.length) throw new Error('no dates');
  const date = dates.data.dates[0].date;
  const slots = await call(`/api/availability?masterId=${master.id}&serviceId=${service.id}&date=${date}`);
  if (!slots.data.slots.length) throw new Error('no slots');
  const booking = await call('/api/bookings', {
    method: 'POST',
    body: {
      masterId: master.id,
      serviceId: service.id,
      startAt: slots.data.slots[0].startAt,
      clientName: 'Анна Иванова',
      clientPhone: '+7 903 111-22-33',
      clientEmail: 'client@lunea.test',
    },
  });
  const cancelled = await call(`/api/bookings/${booking.data.id}`, { method: 'PATCH', body: { status: 'CANCELLED' } });
  if (cancelled.data.status !== 'CANCELLED') throw new Error('cancel failed');
  jar.clear();
  await call('/api/auth/csrf');
  await call('/api/auth/login', { method: 'POST', body: { email: 'owner@lunea.test', password: 'LuneaDemo2026!' } });
  const stats = await call('/api/business/stats');
  if (!stats.data.workspace.salon) throw new Error('owner salon missing');
  const created = await call('/api/services', {
    method: 'POST',
    body: {
      name: 'Пробный уход',
      categoryId: salon.data.services[0].categoryId,
      description: 'Короткая услуга для проверки',
      durationMin: 30,
      price: 1900,
      masterIds: [master.id],
      active: true,
    },
  });
  await call(`/api/services/${created.data.id}`, { method: 'PATCH', body: { active: false } });
  jar.clear();
  await call('/api/auth/csrf');
  await call('/api/auth/login', { method: 'POST', body: { email: 'admin@lunea.test', password: 'LuneaDemo2026!' } });
  const reports = await call('/api/admin/reports');
  if (!reports.data.salons) throw new Error('admin reports');
  console.log('smoke ok', booking.data.publicId, reports.data.bookings);
}

main().catch((error) => {
  console.error(error.message);
  if (error.payload) console.error(JSON.stringify(error.payload));
  process.exit(1);
});
