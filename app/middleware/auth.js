/**
 * 认证中间件示例
 * 可以根据需要启用
 */

module.exports = async (ctx, next) => {
  // 示例：简单的token验证
  const token = ctx.headers.authorization;
  
  if (!token && ctx.path.startsWith('/api')) {
    // 某些公开接口可以跳过认证
    const publicPaths = ['/api/user'];
    if (!publicPaths.includes(ctx.path)) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: 'Unauthorized'
      };
      return;
    }
  }
  
  // 验证token逻辑（示例）
  if (token) {
    // 这里应该验证token的有效性
    // ctx.user = await verifyToken(token);
  }
  
  await next();
};
