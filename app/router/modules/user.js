module.exports = function registerUserRoutes(router) {
  const permit = require('../../middleware/requirePermission');
  const userController = require('../../controller/user');

  // 用户相关路由（业务用户）
  router.get('/api/user', permit('user:read'), userController.list);
  router.get('/api/user/:id', permit('user:read'), userController.detail);
  router.post('/api/user', permit('user:create'), userController.create);
  router.put('/api/user/:id', permit('user:update'), userController.update);
  router.delete('/api/user/:id', permit('user:delete'), userController.delete);
};

