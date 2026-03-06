/**
 * 应用挂载：静态资源、视图、中间件、路由等
 * 保持 app.js 只做「创建实例 + 调用 setup + 监听 + 启动」
 */
const path = require('path');
const fs = require('fs');
const bodyParser = require('koa-bodyparser');
const serveStatic = require('koa-static');
const views = require('@ladjs/koa-views');

const createRequestLogger = require('./middleware/requestLogger');
const createErrorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const middleware = require('./middleware');
const router = require('./router');

const rootDir = path.join(__dirname, '..');

function setup(app, config, logger) {
  // 静态资源
  if (config.static && config.static.enable !== false) {
    const staticPath = path.join(rootDir, config.static.dir || 'public');
    if (fs.existsSync(staticPath)) {
      app.use(serveStatic(staticPath, config.static.options || {}));
    }
  }

  // 视图
  if (config.view && config.view.enable !== false) {
    const viewPath = path.join(rootDir, config.view.root || 'app/view');
    if (fs.existsSync(viewPath)) {
      app.use(views(viewPath, config.view.options || { extension: 'ejs' }));
    }
  }

  app.use(bodyParser(config.bodyParser || {}));
  app.use(createRequestLogger(logger));

  if (middleware && typeof middleware === 'function') {
    app.use(middleware);
  }

  app.use(createErrorHandler(config, logger));
  app.use(router.routes()).use(router.allowedMethods());
  app.use(notFound);
}

module.exports = setup;
