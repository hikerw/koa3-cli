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

function logMeta(ctx, extra = {}) {
  return {
    requestId: ctx.state && ctx.state.requestId,
    method: ctx.method,
    url: ctx.originalUrl || ctx.url,
    ...extra
  };
}

class UserController {
  async list(ctx) {
    try {
      const users = await userService.getUserList();
      ctx.logger.info('User list fetched', logMeta(ctx, { count: Array.isArray(users) ? users.length : undefined }));
      ctx.body = users;
    } catch (error) {
      ctx.logger.error('Failed to fetch user list', logMeta(ctx, { message: error.message, stack: error.stack }));
      ctx.throw(500, error.message);
    }
  }

  async detail(ctx) {
    const { id } = await validateValue(idParamSchema, ctx.params);

    try {
      const user = await userService.getUserById(id);
      if (!user) {
        ctx.logger.warn('User detail not found', logMeta(ctx, { userId: id }));
        ctx.status = 404;
        ctx.body = { message: 'User not found' };
        return;
      }

      ctx.logger.info('User detail fetched', logMeta(ctx, { userId: id }));
      ctx.body = user;
    } catch (error) {
      ctx.logger.error('Failed to fetch user detail', logMeta(ctx, { userId: id, message: error.message, stack: error.stack }));
      ctx.throw(500, error.message);
    }
  }

  async create(ctx) {
    const userData = await validateValue(createUserBodySchema, ctx.request.body);

    try {
      const user = await userService.createUser(userData);
      ctx.logger.info('User created', logMeta(ctx, { userId: user && user.id }));
      ctx.status = 201;
      ctx.body = user;
    } catch (error) {
      ctx.logger.error('Failed to create user', logMeta(ctx, { message: error.message, stack: error.stack }));
      ctx.throw(500, error.message);
    }
  }

  async update(ctx) {
    const { id } = await validateValue(idParamSchema, ctx.params);
    const userData = await validateValue(updateUserBodySchema, ctx.request.body);

    try {
      const user = await userService.updateUser(id, userData);
      if (!user) {
        ctx.logger.warn('User update target not found', logMeta(ctx, { userId: id }));
        ctx.status = 404;
        ctx.body = { message: 'User not found' };
        return;
      }

      ctx.logger.info('User updated', logMeta(ctx, { userId: id }));
      ctx.body = user;
    } catch (error) {
      ctx.logger.error('Failed to update user', logMeta(ctx, { userId: id, message: error.message, stack: error.stack }));
      ctx.throw(500, error.message);
    }
  }

  async delete(ctx) {
    const { id } = await validateValue(idParamSchema, ctx.params);

    try {
      const result = await userService.deleteUser(id);
      if (!result) {
        ctx.logger.warn('User delete target not found', logMeta(ctx, { userId: id }));
        ctx.status = 404;
        ctx.body = { message: 'User not found' };
        return;
      }

      ctx.logger.info('User deleted', logMeta(ctx, { userId: id }));
      ctx.status = 204;
    } catch (error) {
      ctx.logger.error('Failed to delete user', logMeta(ctx, { userId: id, message: error.message, stack: error.stack }));
      ctx.throw(500, error.message);
    }
  }
}

module.exports = new UserController();
