const { Router } = require('@koa/router');
const { validate } = require('./lib/validator');
const userSchema = require('./schema/user');

const router = new Router();

// 加载控制器
const homeController = require('./controller/home');
const userController = require('./controller/user');

// 路由配置
// 首页
router.get('/', homeController.index);

// 用户相关路由
router.get('/api/user', userController.list);
router.get('/api/user/:id', validate({ params: userSchema.idParam }), userController.detail);
router.post('/api/user', validate({ body: userSchema.createUserBody }), userController.create);
router.put('/api/user/:id', validate({ params: userSchema.idParam, body: userSchema.updateUserBody }), userController.update);
router.delete('/api/user/:id', validate({ params: userSchema.idParam }), userController.delete);

module.exports = router;
