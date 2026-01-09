/**
 * 中间件入口文件
 * 可以在这里统一管理和导出所有中间件
 */

// 组合中间件：按顺序执行，确保 next 链正确传递
module.exports = async (ctx, next) => {
  // 1. 请求时间中间件
  ctx.requestTime = Date.now();
  
  // 2. 等待后续中间件执行
  await next();
  
  // 3. API响应格式中间件（在响应返回前处理）
  // 如果是API请求，统一响应格式
  if (ctx.path.startsWith('/api')) {
    if (ctx.body && typeof ctx.body === 'object' && !ctx.body.success) {
      ctx.body = {
        success: true,
        data: ctx.body
      };
    }
  }
};
