function pageParams(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(48, Math.max(1, Number(query.pageSize) || 12));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

function pageMeta(page, pageSize, total) {
  return { page, pageSize, total, pages: Math.ceil(total / pageSize) };
}

module.exports = { pageParams, pageMeta };
