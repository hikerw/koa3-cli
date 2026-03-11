/**
 * 用户控制器
 */
const userService = require('../service/user');

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
    const { id } = ctx.state.validated ? ctx.state.validated.params : ctx.params;
    try {
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
    const userData = ctx.state.validated ? ctx.state.validated.body : ctx.request.body;
    try {
      const user = await userService.createUser(userData);
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
    const { id } = ctx.state.validated ? ctx.state.validated.params : ctx.params;
    const userData = ctx.state.validated ? ctx.state.validated.body : ctx.request.body;
    try {
      const user = await userService.updateUser(id, userData);
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
    const { id } = ctx.state.validated ? ctx.state.validated.params : ctx.params;
    try {
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
