const { ZodError } = require('zod');
const { isProd } = require('../config/env');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) {
      fields[issue.path.join('.')] = issue.message;
    }
    return res.status(400).json({ error: { message: 'Проверьте поля формы', fields } });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const body = {
    error: {
      message: status >= 500 && isProd ? 'Внутренняя ошибка сервера' : err.message || 'Ошибка',
    },
  };
  if (err.fields) body.error.fields = err.fields;
  return res.status(status).json(body);
}

module.exports = { errorHandler };
