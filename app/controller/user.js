/**
 * 用户控制器
 */
const userService = require('../service/user');
const { Joi, validateValue } = require('../lib/validator');

const idParamSchema = Joi.object({
  id: Joi.string().required().messages({ 'any.required': '用户 id 不能为空' })
});

const createUserBodySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': '用户名为必填',
    'string.empty': '用户名不能为空',
    'string.max': '用户名不能超过 100 个字符'
  }),
  email: Joi.string().email().allow('').optional(),
  age: Joi.number().integer().min(0).max(150).optional()
}).options({ stripUnknown: true });

const updateUserBodySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  email: Joi.string().email().allow('').optional(),
  age: Joi.number().integer().min(0).max(150).optional()
}).min(1).messages({
  'object.min': '至少需要提供一个要更新的字段'
}).options({ stripUnknown: true });

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
    const { id } = await validateValue(idParamSchema, ctx.params);

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
    const userData = await validateValue(createUserBodySchema, ctx.request.body);

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
    const { id } = await validateValue(idParamSchema, ctx.params);
    const userData = await validateValue(updateUserBodySchema, ctx.request.body);

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
    const { id } = await validateValue(idParamSchema, ctx.params);

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
