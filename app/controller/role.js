const roleService = require('../service/role');
const logService = require('../service/log');
const { Joi, objectIdArray, validateBody, requireParamObjectId } = require('../lib/validate');
const { ok, reject } = require('../lib/response');

class RoleController {
  async list(ctx) {
    const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(ctx.query.pageSize, 10) || 100));
    const keyword = ctx.query.keyword || '';
    const result = await roleService.getList({ page, pageSize, keyword });
    ok(ctx, result);
  }

  async all(ctx) {
    const list = await roleService.getAll();
    ok(ctx, list);
  }

  async detail(ctx) {
    const id = requireParamObjectId(ctx, 'id', '角色 id 不能为空或不合法');
    if (!id) return;
    const role = await roleService.getById(id);
    if (!role) {
      reject(ctx, 404, 'Not found');
      return;
    }
    ok(ctx, role);
  }

  async create(ctx) {
    const schema = Joi.object({
      name: Joi.string().trim().min(1).max(64).required().messages({
        'any.required': '名称不能为空',
        'string.empty': '名称不能为空',
        'string.min': '名称不能为空',
        'string.max': '名称过长'
      }),
      code: Joi.string().trim().min(1).max(64).required().messages({
        'any.required': '编码不能为空',
        'string.empty': '编码不能为空',
        'string.min': '编码不能为空',
        'string.max': '编码过长'
      }),
      permissionIds: Joi.any().custom(objectIdArray).default([]).messages({
        'any.invalid': 'permissionIds 包含非法 id',
        'array.base': 'permissionIds 必须是数组'
      }),
      description: Joi.string().allow('').trim().max(512).default('')
    }).unknown(false);

    const value = validateBody(ctx, schema);
    if (!value) return;

    const role = await roleService.create(value);
    await logService.create(ctx, {
      action: 'create',
      module: 'role',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: role?.id,
      detail: `新增角色: ${role?.name || ''}`
    });
    ok(ctx, role);
  }

  async update(ctx) {
    const id = requireParamObjectId(ctx, 'id', '角色 id 不能为空或不合法');
    if (!id) return;
    const schema = Joi.object({
      name: Joi.string().trim().min(1).max(64).messages({
        'string.empty': '名称不能为空',
        'string.min': '名称不能为空',
        'string.max': '名称过长'
      }),
      code: Joi.string().trim().min(1).max(64).messages({
        'string.empty': '编码不能为空',
        'string.min': '编码不能为空',
        'string.max': '编码过长'
      }),
      permissionIds: Joi.any().custom(objectIdArray).messages({
        'any.invalid': 'permissionIds 包含非法 id',
        'array.base': 'permissionIds 必须是数组'
      }),
      description: Joi.string().allow('').trim().max(512)
    })
      .min(1)
      .unknown(false);

    const value = validateBody(ctx, schema);
    if (!value) return;

    const role = await roleService.update(id, value);
    if (!role) {
      reject(ctx, 404, 'Not found');
      return;
    }
    await logService.create(ctx, {
      action: 'update',
      module: 'role',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: role.id,
      detail: `更新角色: ${role.name || ''}`
    });
    ok(ctx, role);
  }

  async delete(ctx) {
    const id = requireParamObjectId(ctx, 'id', '角色 id 不能为空或不合法');
    if (!id) return;
    const before = await roleService.getById(id);
    const deleted = await roleService.delete(id);
    if (!deleted) {
      reject(ctx, 404, 'Not found');
      return;
    }
    await logService.create(ctx, {
      action: 'delete',
      module: 'role',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: id,
      detail: before ? `删除角色: ${before.name}` : `删除角色 id: ${id}`
    });
    ok(ctx, { message: 'Deleted' });
  }
}

module.exports = new RoleController();
