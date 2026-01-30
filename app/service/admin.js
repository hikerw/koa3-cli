const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Admin, ensureDefaultAdmin } = require('../model/admin');

class AdminService {
  constructor(config) {
    this.jwtConfig = config?.jwt || {};
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    ensureDefaultAdmin({ username: defaultUsername, password: defaultPassword }).catch((err) => {
      console.error('[Admin] ensure default error:', err);
    });
  }

  async login({ username, password }) {
    const user = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      const err = new Error('账号或密码错误');
      err.status = 401;
      throw err;
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const err = new Error('账号或密码错误');
      err.status = 401;
      throw err;
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      this.jwtConfig.secret,
      { expiresIn: this.jwtConfig.expiresIn || '7d' }
    );
    return {
      token,
      user: user.toJSON()
    };
  }
}

module.exports = AdminService;
