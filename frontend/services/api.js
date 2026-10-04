function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const pair = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.split('=').slice(1).join('=')) : '';
}

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

export async function api(path, options = {}, retry = true) {
  const method = options.method || 'GET';
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = readCookie('csrf_token');
    if (csrf) headers['x-csrf-token'] = csrf;
  }
  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'include',
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
  });
  if (response.status === 401 && retry && !path.startsWith('/api/auth/')) {
    const csrf = readCookie('csrf_token');
    const refreshed = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: csrf ? { 'x-csrf-token': csrf } : {},
    });
    if (refreshed.ok) return api(path, options, false);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(payload.error?.message || 'Ошибка запроса', response.status, payload.error?.fields);
  }
  return payload;
}
