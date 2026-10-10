module.exports = function registerDashboardRoutes(router) {
  const permit = require('../../middleware/requirePermission');
  const dashboardController = require('../../controller/dashboard');
  router.get('/api/dashboard/stats', permit('dashboard:read'), dashboardController.stats);
};

