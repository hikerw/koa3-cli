const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const static = require('koa-static');
const views = require('@ladjs/koa-views');
const path = require('path');
const fs = require('fs');
const { connectMongo } = require('./app/model/db');

// 加载环境变量
require('dotenv').config();

// 加载配置（支持环境配置覆盖）
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
  // 环境配置文件不存在时忽略
}
const config = Object.assign({}, defaultConfig, envConfig);

// 连接 MongoDB，成功后初始化默认菜单
const menuService = require('./app/service/menu');
connectMongo(config.mongo)
  .then(() =>
    menuService
      .ensureDefaultMenus()
      .then(() => menuService.ensureLogsMenu())
      .catch((err) => console.error('[Menu] 默认菜单初始化失败:', err))
  )
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
  });

// 加载中间件
const middleware = require('./app/middleware');
const authMiddleware = require('./app/middleware/auth');
const requireSuperAdmin = require('./app/middleware/requireSuperAdmin');
const loginRateLimit = require('./app/middleware/loginRateLimit');

// 加载路由
const router = require('./app/router');

const app = new Koa();

// 应用配置
app.keys = config.keys || ['koa2-cli-secret-key'];

// 登录限流（仅对 /api/admin/login 生效，防暴力破解）
app.use(loginRateLimit());

// 静态资源
if (config.static && config.static.enable !== false) {
  const staticPath = path.join(__dirname, config.static.dir || 'public');
  if (fs.existsSync(staticPath)) {
    app.use(static(staticPath, config.static.options || {}));
  }
}

// 模板引擎
if (config.view && config.view.enable !== false) {
  const viewPath = path.join(__dirname, config.view.root || 'app/view');
  if (fs.existsSync(viewPath)) {
    app.use(views(viewPath, config.view.options || {
      extension: 'ejs'
    }));
  }
}

// 请求体解析
app.use(bodyParser(config.bodyParser || {}));

// 认证中间件（JWT）
app.use(authMiddleware(config.jwt, ['/api/admin/login']));

// 系统设置相关接口仅超级管理员可访问（/api/system/menus/current 除外，用于侧栏菜单）
app.use(async (ctx, next) => {
  const path = ctx.path;
  if (path.startsWith('/api/system') && path !== '/api/system/menus/current') {
    return requireSuperAdmin()(ctx, next);
  }
  await next();
});

// 自定义中间件
if (middleware && typeof middleware === 'function') {
  app.use(middleware);
}

// 错误处理中间件
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
    ctx.app.emit('error', err, ctx);
  }
});

// 日志中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// 注册路由
app.use(router.routes()).use(router.allowedMethods());

// 404 处理（必须在路由之后）
app.use(async (ctx) => {
  if (ctx.status === 404) {
    ctx.body = {
      success: false,
      message: 'Not Found'
    };
  }
});

// 错误事件监听
app.on('error', (err, ctx) => {
  console.error('Server error:', err);
});

// 启动服务器
const port = config.port || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Environment: ${config.env}`);
});

module.exports = app;
