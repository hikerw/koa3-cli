const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const serveStatic = require('koa-static');
const views = require('@ladjs/koa-views');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('./app/lib/logger');
const createRequestLogger = require('./app/middleware/requestLogger');

require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const defaultConfig = require('./config/config.default');
let envConfig = {};
try {
  if (env === 'production') {
    envConfig = require('./config/config.prod');
  } else if (env === 'local' || env === 'development') {
    envConfig = require('./config/config.local');
  }
} catch (e) {
  // Ignore missing env config override.
}
const config = Object.assign({}, defaultConfig, envConfig);

const middleware = require('./app/middleware');
const router = require('./app/router');

const app = new Koa();
const logger = createLogger({
  ...(config.logger || {}),
  appName: config.name || 'koa3-cli',
  cwd: __dirname
});

app.keys = config.keys || ['koa3-cli-secret-key'];
app.context.logger = logger;

if (config.static && config.static.enable !== false) {
  const staticPath = path.join(__dirname, config.static.dir || 'public');
  if (fs.existsSync(staticPath)) {
    app.use(serveStatic(staticPath, config.static.options || {}));
  }
}

if (config.view && config.view.enable !== false) {
  const viewPath = path.join(__dirname, config.view.root || 'app/view');
  if (fs.existsSync(viewPath)) {
    app.use(views(viewPath, config.view.options || {
      extension: 'ejs'
    }));
  }
}

app.use(bodyParser(config.bodyParser || {}));
app.use(createRequestLogger(logger));

if (middleware && typeof middleware === 'function') {
  app.use(middleware);
}

app.use(async (ctx, next) => {
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
});

app.use(router.routes()).use(router.allowedMethods());

app.use(async (ctx) => {
  if (ctx.status === 404) {
    ctx.body = {
      success: false,
      message: 'Not Found'
    };
  }
});

app.on('error', (err, ctx) => {
  logger.error('Server error event', {
    requestId: ctx && ctx.state && ctx.state.requestId,
    message: err.message,
    stack: err.stack
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
});

const port = config.port || 3000;
app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
  logger.info(`Environment: ${config.env}`);
});

module.exports = app;
