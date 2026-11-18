/**
 * 404 兜底中间件：未匹配路由时返回统一格式
 */
module.exports = async function notFound(ctx) {
  if (ctx.status === 404) {
    // 必须显式写回状态码：Koa 在设置 body 时会隐式把「未显式声明」的默认 404 改成 200，
    // 否则「没有匹配到任何资源」的响应会变成 200 + Not Found 正文，前端无法据此区分成功与失败。
    ctx.status = 404;
    ctx.body = {
      success: false,
      message: 'Not Found'
    };
  }
};
