/**
 * 登录接口限流：同一 IP 在时间窗口内最多尝试 N 次，防止暴力破解
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 分钟
const MAX_ATTEMPTS = 10;
const store = new Map();

function getClientIp(ctx) {
  return ctx.headers['x-forwarded-for']?.split(',')[0]?.trim() || ctx.ip || ctx.request.ip || 'unknown';
}

function cleanup() {
  const now = Date.now();
  for (const [key, v] of store.entries()) {
    if (v.resetAt < now) store.delete(key);
  }
}

module.exports = () => async (ctx, next) => {
  if (ctx.path !== '/api/admin/login') return next();

  cleanup();
  const ip = getClientIp(ctx);
  const now = Date.now();
  let record = store.get(ip);
  if (!record) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    store.set(ip, record);
  }
  if (now >= record.resetAt) {
    record.count = 0;
    record.resetAt = now + WINDOW_MS;
  }
  record.count += 1;
  if (record.count > MAX_ATTEMPTS) {
    ctx.status = 429;
    ctx.body = { success: false, message: '登录尝试过于频繁，请稍后再试' };
    return;
  }
  await next();
};
