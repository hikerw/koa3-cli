/**
 * JWT 认证中间件
 * ctx.state.user: { id, username, isSuperAdmin }
 */
const jwt = require('jsonwebtoken');
const { reject } = require('../lib/response');

module.exports = (jwtConfig = {}, whitelist = []) => {
  return async (ctx, next) => {
    if (!ctx.path.startsWith('/api')) return next();
    if (whitelist.includes(ctx.path)) return next();
    // 小程序业务由独立的 miniAuth 路由中间件校验，不能复用后台管理员身份。
    if (ctx.path.startsWith('/api/mini/')) return next();

    const authHeader = ctx.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      reject(ctx, 401, '未授权');
      return;
    }

    try {
      const payload = jwt.verify(token, jwtConfig.secret);
      // 即使部署时误用了相同密钥，小程序令牌也不能进入后台权限体系。
      if (payload.scope === 'mini') throw new Error('小程序令牌不能用于后台');
      ctx.state.user = {
        id: payload.id,
        username: payload.username,
        isSuperAdmin: !!payload.isSuperAdmin
      };
    } catch (err) {
      reject(ctx, 401, '令牌无效或过期');
      return;
    }
    await next();
  };
};

