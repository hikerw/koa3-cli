/**
 * 首页控制器
 */
class HomeController {
  /**
   * 首页
   */
  async index(ctx) {
    ctx.body = {
      message: 'Welcome to Koa3 CLI',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new HomeController();
