const User = require('../model/user');
const Admin = require('../model/admin');
const Role = require('../model/role');
const Permission = require('../model/permission');
const Menu = require('../model/menu');

async function getStats() {
  const [userCount, systemUserCount, roleCount, permissionCount, menuCount] = await Promise.all([
    User.countDocuments(),
    Admin.countDocuments(),
    Role.countDocuments(),
    Permission.countDocuments(),
    Menu.countDocuments()
  ]);
  return {
    userCount,
    systemUserCount,
    roleCount,
    permissionCount,
    menuCount
  };
}

function getSystemInfo() {
  return {
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
    platform: process.platform
  };
}

class DashboardController {
  async stats(ctx) {
    try {
      // const stats = await getStats();
      const system = getSystemInfo();
      ctx.body = {  system };
    } catch (err) {
      ctx.throw(500, err.message);
    }
  }
}

module.exports = new DashboardController();
