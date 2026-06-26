const dashboardService = require('../service/dashboard');

class DashboardController {
  /**
   * 首页统计接口。
   *
   * 只返回当前项目能真实采集到的数据，避免前端为了贴近截图展示不可验证的假指标。
   */
  async stats(ctx) {
    try {
      ctx.body = await dashboardService.getDashboardStats();
    } catch (err) {
      ctx.throw(500, err.message);
    }
  }
}

module.exports = new DashboardController();
