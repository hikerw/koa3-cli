const Log = require('../model/log');

function getClientIp(ctx) {
  return ctx?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || ctx?.ip || ctx?.request?.ip || '';
}

function getUserAgent(ctx) {
  return ctx?.headers?.['user-agent'] || '';
}

/**
 * 写入一条操作日志（不阻塞主流程，忽略错误）
 */
async function create(ctx, { action, module, operatorId = null, operatorName = '', targetId = null, detail = '' }) {
  const payload = {
    action,
    module,
    operatorId: operatorId ?? null,
    operatorName: String(operatorName || '').slice(0, 64),
    targetId: targetId ?? null,
    detail: String(detail || '').slice(0, 500),
    ip: getClientIp(ctx),
    userAgent: getUserAgent(ctx)
  };
  try {
    await Log.create(payload);
  } catch (err) {
    console.error('[Log] write error:', err.message);
  }
}

/**
 * 分页查询日志
 */
async function getList({ page = 1, pageSize = 20, action = '', module = '', keyword = '', startDate = '', endDate = '' } = {}) {
  const filter = {};
  if (action && action.trim()) filter.action = action.trim();
  if (module && module.trim()) filter.module = module.trim();
  if (keyword && keyword.trim()) {
    filter.$or = [
      { operatorName: { $regex: keyword.trim(), $options: 'i' } },
      { detail: { $regex: keyword.trim(), $options: 'i' } }
    ];
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
  }
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(pageSize, 10)));
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
  const [items, total] = await Promise.all([
    Log.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Log.countDocuments(filter)
  ]);
  const list = items.map((d) => ({
    id: d._id.toString(),
    action: d.action,
    module: d.module,
    operatorId: d.operatorId,
    operatorName: d.operatorName,
    targetId: d.targetId,
    detail: d.detail,
    ip: d.ip,
    userAgent: d.userAgent,
    createdAt: d.createdAt
  }));
  return { list, total };
}

module.exports = {
  create,
  getList,
  getClientIp,
  getUserAgent
};
