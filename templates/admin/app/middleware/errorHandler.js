/**
 * 全局错误处理中间件：捕获异常、记录日志、统一错误响应
 */
module.exports = function createErrorHandler(config, logger) {
  return async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      const firstDetailMessage = err.details && err.details[0] && err.details[0].message;
      ctx.body = {
        success: false,
        message: firstDetailMessage || err.message || 'Internal Server Error',
        ...(err.details && { errors: err.details })
      };

      logger.error('Request failed', {
        requestId: ctx.state && ctx.state.requestId,
        method: ctx.method,
        url: ctx.originalUrl || ctx.url,
        status: ctx.status,
        message: err.message,
        stack: err.stack
      });

      ctx.app.emit('error', err, ctx);
    }
  };
};
