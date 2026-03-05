function createRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = function requestLogger(logger) {
  return async function requestLoggerMiddleware(ctx, next) {
    const start = Date.now();
    const requestId = ctx.get('x-request-id') || createRequestId();

    ctx.state.requestId = requestId;
    ctx.set('x-request-id', requestId);

    try {
      await next();
    } finally {
      const duration = Date.now() - start;
      logger.access({
        requestId,
        method: ctx.method,
        url: ctx.originalUrl || ctx.url,
        status: ctx.status,
        duration,
        ip: ctx.ip
      });
    }
  };
};
