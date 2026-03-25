const { Router } = require('@koa/router');

const router = new Router();

// 模块化路由
require('./router/modules/home')(router);
require('./router/modules/auth')(router);
require('./router/modules/dashboard')(router);
require('./router/modules/user')(router);
require('./router/modules/system')(router);
require('./router/modules/materials')(router);

module.exports = router;

