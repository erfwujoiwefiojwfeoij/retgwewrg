const crypto = require('crypto');
const { isProd } = require('../config/env');

const SAFE_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
  '/api/auth/verify-email',
]);

function cookieOptions() {
  return {
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  };
}

function ensureCsrf(req, res, next) {
  if (!req.cookies.csrf_token) {
    const token = crypto.randomBytes(24).toString('hex');
    res.cookie('csrf_token', token, { ...cookieOptions(), httpOnly: false });
    req.cookies.csrf_token = token;
  }
  next();
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (SAFE_PATHS.has(req.path)) return next();
  const header = req.get('x-csrf-token');
  if (!header || header !== req.cookies.csrf_token) {
    return res.status(403).json({ error: { message: 'Недействительный CSRF-токен' } });
  }
  return next();
}

module.exports = { ensureCsrf, requireCsrf, cookieOptions };
