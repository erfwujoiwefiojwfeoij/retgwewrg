const nodemailer = require('nodemailer');
const { frontendUrl, isProd } = require('../config/env');

async function sendMail({ to, subject, text, link }) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(`[mail:dev] to=${to} subject=${subject} link=${link || ''}`);
    return { dev: true, link };
  }
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || 'LUNEA <noreply@lunea.test>',
    to,
    subject,
    text: `${text}\n${link || ''}`,
  });
  return { dev: false };
}

function appLink(pathname) {
  return `${frontendUrl}${pathname}`;
}

function exposeDevLink(result) {
  if (!isProd && result && result.dev) return result.link;
  return undefined;
}

module.exports = { sendMail, appLink, exposeDevLink };
