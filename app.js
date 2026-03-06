require('dotenv').config();

const Koa = require('koa');
const { loadConfig } = require('./config/loader');
const { createLogger } = require('./app/lib/logger');
const setup = require('./app/setup');
const setupProcessEvents = require('./app/processEvents');

const config = loadConfig();
const app = new Koa();
const logger = createLogger({
  ...(config.logger || {}),
  appName: config.name || 'koa3-cli',
  cwd: __dirname
});

app.keys = config.keys || ['koa3-cli-secret-key'];
app.context.logger = logger;

setup(app, config, logger);

app.on('error', (err, ctx) => {
  logger.error('Server error event', {
    requestId: ctx && ctx.state && ctx.state.requestId,
    message: err.message,
    stack: err.stack
  });
});

setupProcessEvents(logger);

const port = config.port || 3000;
app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
  logger.info(`Environment: ${config.env}`);
});

module.exports = app;
