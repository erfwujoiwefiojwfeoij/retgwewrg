const { AppError } = require('../utils/errors');

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!parsed.success) {
      const fields = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.slice(1).join('.') || 'form';
        if (!fields[key]) fields[key] = issue.message;
      }
      return next(new AppError(400, 'Проверьте поля формы', fields));
    }
    if (parsed.data.body) req.body = parsed.data.body;
    if (parsed.data.query) req.query = parsed.data.query;
    if (parsed.data.params) req.params = parsed.data.params;
    return next();
  };
}

module.exports = { validate };
