const { Router } = require('@koa/router');
const router = new Router();

// 加载控制器
const homeController = require('./controller/home');
const userController = require('./controller/user');

// 路由配置
// 首页
router.get('/', homeController.index);

// 用户相关路由
router.get('/api/user', userController.list);
router.get('/api/user/:id', userController.detail);
router.post('/api/user', userController.create);
router.put('/api/user/:id', userController.update);
router.delete('/api/user/:id', userController.delete);

module.exports = router;
