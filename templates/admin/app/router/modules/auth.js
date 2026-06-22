module.exports = function registerAuthRoutes(router) {
  const adminController = require('../../controller/admin');
  router.post('/api/admin/login', adminController.login);
};

