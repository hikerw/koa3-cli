/**
 * 应用挂载：静态资源、视图、中间件、路由等
 * 保持 app.js 只做「创建实例 + 调用 setup + 监听 + 启动」
 */
const path = require('path');
const fs = require('fs');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const serveStatic = require('koa-static');
const views = require('@ladjs/koa-views');

const createRequestLogger = require('./middleware/requestLogger');
const createErrorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const middleware = require('./middleware');
const router = require('./router');

const rootDir = path.join(__dirname, '..');

/**
 * 生成静态资源缓存配置。
 *
 * SPA 的入口 index.html 会引用最新一批带 hash 的 JS/CSS 文件，如果入口文件被浏览器或 CDN
 * 长时间缓存，用户发布后仍会拿到旧入口，进而继续加载旧资源。这里仅禁止 index.html 缓存，
 * 其他静态资源继续使用配置里的 maxAge，保证发布更新及时生效且不影响资源缓存性能。
 *
 * @param {Object} staticOptions koa-static 原始配置项
 * @returns {Object} 注入 index.html 不缓存策略后的 koa-static 配置项
 */
function createStaticOptions(staticOptions = {}) {
  const userSetHeaders = staticOptions.setHeaders;

  return {
    ...staticOptions,
    setHeaders(res, filePath, stats) {
      if (typeof userSetHeaders === 'function') {
        userSetHeaders(res, filePath, stats);
      }

      // koa-send 在启用 gzip/brotli 时传入的是 index.html.gz / index.html.br，
      // 需要去掉压缩扩展名后再判断，避免预压缩入口文件继续被长缓存。
      const normalizedFileName = path.basename(filePath).replace(/\.(br|gz)$/i, '');
      if (normalizedFileName === 'index.html') {
        res.setHeader('Cache-Control', INDEX_HTML_CACHE_CONTROL);
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  };
}

function setup(app, config, logger) {
  // 静态资源
  if (config.static && config.static.enable !== false) {
    const staticPath = path.join(rootDir, config.static.dir || 'public');
    if (fs.existsSync(staticPath)) {
      app.use(serveStatic(staticPath, createStaticOptions(config.static.options || {})));
    }
  }

  // 视图
  if (config.view && config.view.enable !== false) {
    const viewPath = path.join(rootDir, config.view.root || 'app/view');
    if (fs.existsSync(viewPath)) {
      app.use(views(viewPath, config.view.options || { extension: 'ejs' }));
    }
  }

  // CORS 默认关闭，避免脚手架生成的项目在未明确授权时开放跨域。
  // 需要给前端应用或第三方调用方开放接口时，可通过 config.cors.enable 或 CORS_ENABLE 开启。
  if (config.cors && config.cors.enable === true) {
    app.use(cors(config.cors.options || {}));
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
