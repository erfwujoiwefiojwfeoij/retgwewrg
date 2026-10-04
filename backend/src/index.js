const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { execSync } = require('child_process');
const { port, frontendUrl, uploadDir, isProd } = require('./config/env');
const { ensurePostgres } = require('../../database/postgres');
const { ensureCsrf, requireCsrf } = require('./middleware/csrf');
const { attachUser } = require('./middleware/auth');
const { errorHandler } = require('./middleware/error');
const routes = require('./routes');
const { sendReminders } = require('./services/reminders');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/uploads', express.static(uploadDir));
app.use(ensureCsrf);
app.use(requireCsrf);
app.use(attachUser);
app.use('/api', routes);
app.use(errorHandler);

async function boot() {
  await ensurePostgres();
  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
  app.listen(port, () => {
    console.log(`LUNEA API http://localhost:${port}`);
  });
  sendReminders().catch((error) => console.error(error));
  setInterval(() => {
    sendReminders().catch((error) => console.error(error));
  }, 30 * 60 * 1000).unref();
}

boot().catch((error) => {
  console.error(error);
  process.exit(1);
});

module.exports = app;
