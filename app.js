require('dotenv').config();

const Koa = require('koa');
const { loadConfig } = require('./config/loader');
const { createLogger } = require('./app/lib/logger');
const setup = require('./app/setup');
const setupProcessEvents = require('./app/processEvents');

const config = loadConfig();
const app = new Koa();
// 启用代理信任（关键配置）
app.proxy = true;
const logger = createLogger({
  ...(config.logger || {}),
  appName: config.name || 'koa3-cli',
  cwd: __dirname
});

app.keys = config.keys || ['koa3-cli-secret-key'];
app.context.logger = logger;

app.on('error', (err, ctx) => {
  logger.error('Server error event', {
    requestId: ctx && ctx.state && ctx.state.requestId,
    message: err.message,
    stack: err.stack
  });
});

setupProcessEvents(logger);

(async () => {
  await setup(app, config, logger);
})();

module.exports = app;
