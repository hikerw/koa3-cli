/**
 * 全局错误处理中间件：捕获异常、记录日志、统一错误响应
 */
module.exports = function createErrorHandler(config, logger) {
  return async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = {
        success: false,
        message: err.message || 'Internal Server Error',
        ...(config.env === 'development' && { stack: err.stack })
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
