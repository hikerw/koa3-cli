/**
 * 用户控制器
 */
const userService = require('../service/user');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUserPayload(data, { allowPartial = false } = {}) {
  const { name, email } = data || {};

  if (!allowPartial) {
    if (!name || typeof name !== 'string') return 'name 不能为空';
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) return 'email 不合法';
  } else {
    if (!name && !email) return '至少提供 name 或 email';
    if (name && typeof name !== 'string') return 'name 类型必须是字符串';
    if (email && (typeof email !== 'string' || !emailRegex.test(email))) return 'email 不合法';
  }
  return null;
}

class UserController {
  /**
   * 获取用户列表（分页）
   */
  async list(ctx) {
    try {
      const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(ctx.query.pageSize, 10) || 10));
      const result = await userService.getUserList({ page, pageSize });
      ctx.body = result;
    } catch (error) {
      ctx.throw(500, error.message);
    }
  }

  /**
   * 获取用户详情
   */
  async detail(ctx) {
    try {
      const { id } = ctx.params;
      const user = await userService.getUserById(id);
      if (!user) {
        ctx.status = 404;
        ctx.body = { message: 'User not found' };
        return;
      }
      ctx.body = user;
    } catch (error) {
      ctx.throw(500, error.message);
    }
  }

  /**
   * 创建用户
   */
  async create(ctx) {
    try {
      const validationError = validateUserPayload(ctx.request.body, { allowPartial: false });
      if (validationError) {
        ctx.throw(400, validationError);
      }
      const user = await userService.createUser(ctx.request.body);
      ctx.status = 201;
      ctx.body = user;
    } catch (error) {
      ctx.throw(error.status || 500, error.message);
    }
  }

  /**
   * 更新用户
   */
  async update(ctx) {
    try {
      const validationError = validateUserPayload(ctx.request.body, { allowPartial: true });
      if (validationError) {
        ctx.throw(400, validationError);
      }
      const { id } = ctx.params;
      const user = await userService.updateUser(id, ctx.request.body);
      if (!user) {
        ctx.status = 404;
        ctx.body = { message: 'User not found' };
        return;
      }
      ctx.body = user;
    } catch (error) {
      ctx.throw(error.status || 500, error.message);
    }
  }

  /**
   * 删除用户
   */
  async delete(ctx) {
    try {
      const { id } = ctx.params;
      const result = await userService.deleteUser(id);
      if (!result) {
        ctx.status = 404;
        ctx.body = { message: 'User not found' };
        return;
      }
      ctx.status = 200;
      ctx.body = { message: 'Deleted' };
    } catch (error) {
      ctx.throw(error.status || 500, error.message);
    }
  }
}

module.exports = new UserController();

