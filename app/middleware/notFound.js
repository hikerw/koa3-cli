/**
 * 404 兜底中间件：未匹配路由时返回统一格式
 */
module.exports = async function notFound(ctx) {
  if (ctx.status === 404) {
    ctx.body = {
      success: false,
      message: 'Not Found'
    };
  }
};
