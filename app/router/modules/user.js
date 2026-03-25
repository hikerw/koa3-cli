module.exports = function registerUserRoutes(router) {
  const userController = require('../../controller/user');

  // 用户相关路由（业务用户）
  router.get('/api/user', userController.list);
  router.get('/api/user/:id', userController.detail);
  router.post('/api/user', userController.create);
  router.put('/api/user/:id', userController.update);
  router.delete('/api/user/:id', userController.delete);
};

