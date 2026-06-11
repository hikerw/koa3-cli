/**
 * 应用挂载：静态资源、视图、中间件、路由、MongoDB 连接、HTTP 监听
 * 保持 app.js 只做「创建实例 + 调用 setup + 进程级监听」
 */
const path = require('path');
const fs = require('fs');
const bodyParser = require('koa-bodyparser');
const serveStatic = require('koa-static');
const views = require('@ladjs/koa-views');
const cors = require('@koa/cors');

const createRequestLogger = require('./middleware/requestLogger');
const createErrorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const authMiddleware = require('./middleware/auth');
// const middleware = require('./middleware');
const router = require('./router');
const { connectMongo } = require('./model/db');
const menuService = require('./service/menu');

const rootDir = path.join(__dirname, '..');
const INDEX_HTML_CACHE_CONTROL = 'no-store, no-cache, must-revalidate, proxy-revalidate';


function maskMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/\/\/([^:\/]+):([^@\/]+)@/, '//$1:***@');
}
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
async function setup(app, config, logger) {
  // CORS：解除跨域限制（允许携带 Authorization 头）
  // 注意：若需要携带 Cookie，需将 origin 改为具体域名且 credentials=true
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Content-Length', 'Content-Type'],
      maxAge: 86400
    })
  );

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

  app.use(bodyParser(config.bodyParser || {}));
  app.use(createRequestLogger(logger));

  // if (middleware && typeof middleware === 'function') {
  //   app.use(middleware);
  // }

  // JWT 认证：/api 请求需携带有效 token，白名单路径不校验
  const jwtConfig = config.jwt || {};
  const authWhitelist = ['/api/admin/login'];
  app.use(authMiddleware(jwtConfig, authWhitelist));

  app.use(createErrorHandler(config, logger));
  app.use(router.routes()).use(router.allowedMethods());
  app.use(notFound);

  // MongoDB 连接
  try {
    await connectMongo(config.mongo || {});
    if (config.mongo && config.mongo.uri) {
      logger.info('MongoDB connected', { uri: maskMongoUri(config.mongo.uri.trim()) });
    } else {
      logger.warn('MongoDB config not found, skip connecting');
    }
  } catch (error) {
    logger.error('MongoDB connect failed', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }

  try {
    await menuService.ensureDefaultMenus();
    await menuService.ensureLogsMenu();
    await menuService.ensureStorageMenu();
    await menuService.ensureMaterialsMenu();
  } catch (e) {
    logger.warn('Menu seed skipped', { message: e.message });
  }

  // HTTP 监听
  const port = config.port || 3000;
  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
    logger.info(`Environment: ${config.env}`);
  });
}

module.exports = setup;
