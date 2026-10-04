const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Не задана переменная окружения ${key}`);
  }
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  uploadDir: path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || '../uploads'),
  isProd: process.env.NODE_ENV === 'production',
};
