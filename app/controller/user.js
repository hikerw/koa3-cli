/**
 * 用户控制器
 */
const userService = require('../service/user');

class UserController {
  /**
   * 获取用户列表
   */
  async list(ctx) {
    try {
      const users = await userService.getUserList();
      ctx.body = users;
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
      const userData = ctx.request.body;
      const user = await userService.createUser(userData);
      ctx.status = 201;
      ctx.body = user;
    } catch (error) {
      ctx.throw(500, error.message);
    }
  }

  /**
   * 更新用户
   */
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const userData = ctx.request.body;
      const user = await userService.updateUser(id, userData);
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
      ctx.status = 204;
    } catch (error) {
      ctx.throw(500, error.message);
    }
  }
}

module.exports = new UserController();
