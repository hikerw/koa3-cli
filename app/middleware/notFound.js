/**
 * 404 兜底中间件：未匹配路由时返回统一格式
 */
module.exports = async function notFound(ctx) {
  if (ctx.status === 404) {
    // Koa 的默认 404 属于「隐式状态码」，直接给 ctx.body 赋值会被 Koa 重置为 200。
    // 因此这里必须显式再设置一次，确保未匹配到路由/资源时真正返回 404。
    ctx.status = 404;
    ctx.body = {
      success: false,
      message: 'Not Found'
    };
  }
};
