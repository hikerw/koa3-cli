/**
 * 中间件入口文件
 * 可以在这里统一管理和导出所有中间件
 */

// 组合中间件：按顺序执行，确保 next 链正确传递
module.exports = async (ctx, next) => {
  // 1. 请求时间中间件
  ctx.requestTime = Date.now();

  // 2. 继续执行后续中间件
  await next();

  // 3. API 响应统一格式化（仅处理成功响应）
  if (ctx.path.startsWith('/api')) {
    const isAlreadyWrapped = ctx.body && typeof ctx.body === 'object' && Object.prototype.hasOwnProperty.call(ctx.body, 'success');
    const isErrorStatus = ctx.status && ctx.status >= 400;

    if (!isAlreadyWrapped && !isErrorStatus) {
      ctx.body = {
        success: true,
        data: ctx.body ?? null,
        message: undefined
      };
    }
  }
};

