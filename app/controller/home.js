/**
 * 首页控制器
 */
const { ok } = require('../lib/response');

class HomeController {
  /**
   * 首页
   */
  async index(ctx) {
    ok(ctx, {
      message: 'Welcome to Koa3 CLI',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new HomeController();
