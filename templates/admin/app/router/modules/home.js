module.exports = function registerHomeRoutes(router) {
  const homeController = require('../../controller/home');
  router.get('/', homeController.index);
};

