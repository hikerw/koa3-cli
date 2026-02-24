const logService = require('../service/log');

class LogController {
  async list(ctx) {
    const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(ctx.query.pageSize, 10) || 20));
    const action = ctx.query.action || '';
    const module = ctx.query.module || '';
    const keyword = ctx.query.keyword || '';
    const startDate = ctx.query.startDate || '';
    const endDate = ctx.query.endDate || '';
    const result = await logService.getList({
      page,
      pageSize,
      action,
      module,
      keyword,
      startDate,
      endDate
    });
    ctx.body = result;
  }
}

module.exports = new LogController();
