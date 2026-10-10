const Admin = require('../model/admin');
const Role = require('../model/role');
const Permission = require('../model/permission');
const apiPermissions = require('../lib/apiPermissions');

const codes = new Set(apiPermissions.map((permission) => permission.code));

module.exports = function requirePermission(code) {
  if (!codes.has(code)) throw new Error(`Unknown API permission: ${code}`);

  return async (ctx, next) => {
    const id = ctx.state.user?.id;
    if (!id) {
      ctx.status = 401;
      ctx.body = { success: false, message: '未授权' };
      return;
    }

    // Never trust stale role or super-admin claims from a previously issued JWT.
    const admin = await Admin.findById(id).select('username roleIds isSuperAdmin').lean();
    if (!admin) {
      ctx.status = 401;
      ctx.body = { success: false, message: '账号不存在或已被删除' };
      return;
    }
    ctx.state.user = { id: admin._id.toString(), username: admin.username, isSuperAdmin: !!admin.isSuperAdmin };
    if (admin.isSuperAdmin) return next();

    const roles = await Role.find({ _id: { $in: admin.roleIds || [] } }).select('permissionIds').lean();
    const permissionIds = roles.flatMap((role) => role.permissionIds || []);
    const allowed = permissionIds.length > 0 && await Permission.exists({
      _id: { $in: permissionIds },
      code,
      type: 'api'
    });
    if (!allowed) {
      ctx.status = 403;
      ctx.body = { success: false, message: '没有该操作权限', permission: code };
      return;
    }
    await next();
  };
};
