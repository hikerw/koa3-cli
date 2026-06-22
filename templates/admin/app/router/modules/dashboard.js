module.exports = function registerDashboardRoutes(router) {
  const dashboardController = require('../../controller/dashboard');
  router.get('/api/dashboard/stats', dashboardController.stats);
};

