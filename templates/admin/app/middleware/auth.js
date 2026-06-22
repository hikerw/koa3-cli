/**
 * JWT 认证中间件
 * ctx.state.user: { id, username, isSuperAdmin }
 */
const jwt = require('jsonwebtoken');

module.exports = (jwtConfig = {}, whitelist = []) => {
  return async (ctx, next) => {
    if (!ctx.path.startsWith('/api')) return next();
    if (whitelist.includes(ctx.path)) return next();

    const authHeader = ctx.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      ctx.status = 401;
      ctx.body = { success: false, message: '未授权' };
      return;
    }

    try {
      const payload = jwt.verify(token, jwtConfig.secret);
      ctx.state.user = {
        id: payload.id,
        username: payload.username,
        isSuperAdmin: !!payload.isSuperAdmin
      };
      await next();
    } catch (err) {
      ctx.status = 401;
      ctx.body = { success: false, message: '令牌无效或过期' };
    }
  };
};

