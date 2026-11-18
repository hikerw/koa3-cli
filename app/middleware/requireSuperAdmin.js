/**
 * 要求当前用户为超级管理员，用于 /api/system/* 敏感接口（除 menus/current 外）
 */
const { reject } = require('../lib/response');

module.exports = () => async (ctx, next) => {
  if (!ctx.state.user) {
    reject(ctx, 401, '未授权');
    return;
  }
  if (!ctx.state.user.isSuperAdmin) {
    reject(ctx, 403, '需要超级管理员权限');
    return;
  }
  await next();
};
