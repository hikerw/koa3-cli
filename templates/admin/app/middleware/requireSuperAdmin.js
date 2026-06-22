/**
 * 要求当前用户为超级管理员，用于 /api/system/* 敏感接口（除 menus/current 外）
 */
module.exports = () => async (ctx, next) => {
  if (!ctx.state.user) {
    ctx.status = 401;
    ctx.body = { success: false, message: '未授权' };
    return;
  }
  if (!ctx.state.user.isSuperAdmin) {
    ctx.status = 403;
    ctx.body = { success: false, message: '需要超级管理员权限' };
    return;
  }
  await next();
};
