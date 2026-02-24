const AdminService = require('../service/admin');
const logService = require('../service/log');
const config = require('../../config/config.default');
let envConfig = {};
try {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') envConfig = require('../../config/config.prod');
  else envConfig = require('../../config/config.local');
} catch (e) {}
const mergedConfig = Object.assign({}, config, envConfig);
const adminService = new AdminService(mergedConfig);

class AdminController {
  async login(ctx) {
    const { username, password } = ctx.request.body || {};
    if (!username || !password) {
      ctx.throw(400, '用户名和密码不能为空');
    }
    try {
      const data = await adminService.login({ username, password });
      await logService.create(ctx, {
        action: 'login_success',
        module: 'auth',
        operatorId: data.user?.id,
        operatorName: data.user?.username ?? username,
        detail: '登录成功'
      });
      ctx.body = data;
    } catch (err) {
      await logService.create(ctx, {
        action: 'login_fail',
        module: 'auth',
        operatorName: String(username || '').slice(0, 64),
        detail: err.message || '登录失败'
      });
      ctx.throw(err.status || 500, err.message || '登录失败');
    }
  }
}

module.exports = new AdminController();
