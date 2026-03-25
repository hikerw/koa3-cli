const permissionService = require('../service/permission');
const logService = require('../service/log');
const { Joi, objectIdAllowEmpty, objectIdArray, validateBody } = require('../lib/validate');

class PermissionController {
  async list(ctx) {
    const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(ctx.query.pageSize, 10) || 500));
    const keyword = ctx.query.keyword || '';
    const tree = ctx.query.tree === 'true' || ctx.query.tree === '1';
    const result = await permissionService.getList({ page, pageSize, keyword, tree });
    ctx.body = result;
  }

  async tree(ctx) {
    const list = await permissionService.getTree();
    ctx.body = list;
  }

  async detail(ctx) {
    const perm = await permissionService.getById(ctx.params.id);
    if (!perm) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    ctx.body = perm;
  }

  async create(ctx) {
    const schema = Joi.object({
      name: Joi.string().trim().min(1).max(64).required().messages({
        'any.required': '名称不能为空',
        'string.empty': '名称不能为空',
        'string.min': '名称不能为空',
        'string.max': '名称过长'
      }),
      code: Joi.string().trim().min(1).max(128).required().messages({
        'any.required': '编码不能为空',
        'string.empty': '编码不能为空',
        'string.min': '编码不能为空',
        'string.max': '编码过长'
      }),
      type: Joi.string().valid('menu', 'button', 'api').default('api'),
      parentId: Joi.any().custom(objectIdAllowEmpty).default(null).messages({
        'any.invalid': 'parentId 非法'
      }),
      description: Joi.string().allow('').trim().max(512).default(''),
      menuIds: Joi.any().custom(objectIdArray).default([]).messages({
        'any.invalid': 'menuIds 包含非法 id',
        'array.base': 'menuIds 必须是数组'
      })
    }).unknown(false);

    const value = validateBody(ctx, schema);
    if (!value) return;

    const perm = await permissionService.create(value);
    await logService.create(ctx, {
      action: 'create',
      module: 'permission',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: perm?.id,
      detail: `新增权限: ${perm?.name || ''}`
    });
    ctx.status = 201;
    ctx.body = perm;
  }

  async update(ctx) {
    const schema = Joi.object({
      name: Joi.string().trim().min(1).max(64).messages({
        'string.empty': '名称不能为空',
        'string.min': '名称不能为空',
        'string.max': '名称过长'
      }),
      code: Joi.string().trim().min(1).max(128).messages({
        'string.empty': '编码不能为空',
        'string.min': '编码不能为空',
        'string.max': '编码过长'
      }),
      type: Joi.string().valid('menu', 'button', 'api'),
      parentId: Joi.any().custom(objectIdAllowEmpty).messages({
        'any.invalid': 'parentId 非法'
      }),
      description: Joi.string().allow('').trim().max(512),
      menuIds: Joi.any().custom(objectIdArray).messages({
        'any.invalid': 'menuIds 包含非法 id',
        'array.base': 'menuIds 必须是数组'
      })
    })
      .min(1)
      .unknown(false);

    const value = validateBody(ctx, schema);
    if (!value) return;

    const perm = await permissionService.update(ctx.params.id, value);
    if (!perm) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    await logService.create(ctx, {
      action: 'update',
      module: 'permission',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: perm.id,
      detail: `更新权限: ${perm.name || ''}`
    });
    ctx.body = perm;
  }

  async delete(ctx) {
    const id = ctx.params.id;
    const before = await permissionService.getById(id);
    const ok = await permissionService.delete(id);
    if (!ok) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    await logService.create(ctx, {
      action: 'delete',
      module: 'permission',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: id,
      detail: before ? `删除权限: ${before.name}` : `删除权限 id: ${id}`
    });
    ctx.body = { message: 'Deleted' };
  }
}

module.exports = new PermissionController();
