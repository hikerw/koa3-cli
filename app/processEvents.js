/**
 * 进程级错误监听：未捕获的 Promise 与异常
 */
function setupProcessEvents(logger) {
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
  });
}

module.exports = setupProcessEvents;
