const systemUserService = require('../service/systemUser');
const logService = require('../service/log');
const { Joi, objectIdArray, validateBody } = require('../lib/validate');

class SystemUserController {
  async list(ctx) {
    const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(ctx.query.pageSize, 10) || 10));
    const keyword = ctx.query.keyword || '';
    const result = await systemUserService.getList({ page, pageSize, keyword });
    ctx.body = result;
  }

  async detail(ctx) {
    const user = await systemUserService.getById(ctx.params.id);
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    ctx.body = user;
  }

  async create(ctx) {
    const schema = Joi.object({
      username: Joi.string().trim().min(1).max(32).required().messages({
        'any.required': '用户名不能为空',
        'string.empty': '用户名不能为空',
        'string.min': '用户名不能为空',
        'string.max': '用户名过长'
      }),
      password: Joi.string().min(6).max(128).required().messages({
        'any.required': '密码不能为空',
        'string.empty': '密码不能为空',
        'string.min': '密码长度不能小于 6',
        'string.max': '密码过长'
      }),
      roleIds: Joi.any().custom(objectIdArray).default([]).messages({
        'any.invalid': 'roleIds 包含非法 id',
        'array.base': 'roleIds 必须是数组'
      })
    }).unknown(false);

    const value = validateBody(ctx, schema);
    if (!value) return;

    const user = await systemUserService.create(value);
    await logService.create(ctx, {
      action: 'create',
      module: 'system_user',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: user?.id,
      detail: `新增用户: ${value.username}`
    });
    ctx.status = 201;
    ctx.body = user;
  }

  async update(ctx) {
    const schema = Joi.object({
      username: Joi.string().trim().min(1).max(32).messages({
        'string.empty': '用户名不能为空',
        'string.min': '用户名不能为空',
        'string.max': '用户名过长'
      }),
      password: Joi.string().allow('').min(6).max(128).messages({
        'string.min': '密码长度不能小于 6',
        'string.max': '密码过长'
      }),
      roleIds: Joi.any().custom(objectIdArray).messages({
        'any.invalid': 'roleIds 包含非法 id',
        'array.base': 'roleIds 必须是数组'
      })
    })
      .min(1)
      .unknown(false);

    const value = validateBody(ctx, schema);
    if (!value) return;

    const user = await systemUserService.update(ctx.params.id, value);
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    await logService.create(ctx, {
      action: 'update',
      module: 'system_user',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: user.id,
      detail: `更新用户: ${user.username}`
    });
    ctx.body = user;
  }

  async delete(ctx) {
    const id = ctx.params.id;
    const before = await systemUserService.getById(id);
    const ok = await systemUserService.delete(id);
    if (!ok) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    await logService.create(ctx, {
      action: 'delete',
      module: 'system_user',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: id,
      detail: before ? `删除用户: ${before.username}` : `删除用户 id: ${id}`
    });
    ctx.body = { message: 'Deleted' };
  }
}

module.exports = new SystemUserController();
