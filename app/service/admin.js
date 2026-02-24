const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../model/admin');

async function ensureDefaultAdmin({ username, password }) {
  if (!username || !password) return;
  const exist = await Admin.findOne({ username: username.toLowerCase().trim() });
  if (exist) return;
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  await Admin.create({ username: username.toLowerCase().trim(), password: hashed, isSuperAdmin: true });
  console.log(`[Admin] 默认管理员已创建: ${username}`);
}

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
      { id: user.id, username: user.username, isSuperAdmin: !!user.isSuperAdmin },
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
