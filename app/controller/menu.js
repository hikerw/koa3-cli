const menuService = require('../service/menu');
const logService = require('../service/log');
const { Joi, objectIdAllowEmpty, validateBody, requireParamObjectId } = require('../lib/validate');

class MenuController {
  async list(ctx) {
    const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(ctx.query.pageSize, 10) || 500));
    const keyword = ctx.query.keyword || '';
    const tree = ctx.query.tree === 'true' || ctx.query.tree === '1';
    const result = await menuService.getList({ page, pageSize, keyword, tree });
    ctx.body = result;
  }

  async tree(ctx) {
    const list = await menuService.getTree();
    ctx.body = list;
  }

  /** 当前用户可见的菜单树（按权限过滤） */
  async current(ctx) {
    const userId = ctx.state.user?.id;
    if (!userId) {
      ctx.status = 401;
      ctx.body = { message: '未授权' };
      return;
    }
    const list = await menuService.getTreeForUser(userId);
    ctx.body = list;
  }

  async detail(ctx) {
    const id = requireParamObjectId(ctx, 'id', '菜单 id 不能为空或不合法');
    if (!id) return;
    const menu = await menuService.getById(id);
    if (!menu) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    ctx.body = menu;
  }

  async create(ctx) {
    const schema = Joi.object({
      title: Joi.string().trim().min(1).max(64).required().messages({
        'any.required': '标题不能为空',
        'string.empty': '标题不能为空',
        'string.min': '标题不能为空',
        'string.max': '标题过长'
      }),
      path: Joi.string().allow('').trim().max(256).default(''),
      icon: Joi.string().allow('').trim().max(128).default(''),
      parentId: Joi.any().custom(objectIdAllowEmpty).default(null).messages({
        'any.invalid': 'parentId 非法'
      }),
      order: Joi.number().integer().min(0).max(999999).default(0),
      permissionCode: Joi.string().allow('').trim().max(128).default('')
    }).unknown(false);

    const value = validateBody(ctx, schema);
    if (!value) return;

    const menu = await menuService.create(value);
    await logService.create(ctx, {
      action: 'create',
      module: 'menu',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: menu?.id,
      detail: `新增菜单: ${menu?.title || ''}`
    });
    ctx.status = 201;
    ctx.body = menu;
  }

  async update(ctx) {
    const id = requireParamObjectId(ctx, 'id', '菜单 id 不能为空或不合法');
    if (!id) return;
    const schema = Joi.object({
      title: Joi.string().trim().min(1).max(64).messages({
        'string.empty': '标题不能为空',
        'string.min': '标题不能为空',
        'string.max': '标题过长'
      }),
      path: Joi.string().allow('').trim().max(256),
      icon: Joi.string().allow('').trim().max(128),
      parentId: Joi.any().custom(objectIdAllowEmpty).messages({
        'any.invalid': 'parentId 非法'
      }),
      order: Joi.number().integer().min(0).max(999999),
      permissionCode: Joi.string().allow('').trim().max(128)
    })
      .min(1)
      .unknown(false);

    const value = validateBody(ctx, schema);
    if (!value) return;

    const menu = await menuService.update(id, value);
    if (!menu) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    await logService.create(ctx, {
      action: 'update',
      module: 'menu',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: menu.id,
      detail: `更新菜单: ${menu.title || ''}`
    });
    ctx.body = menu;
  }

  async delete(ctx) {
    const id = requireParamObjectId(ctx, 'id', '菜单 id 不能为空或不合法');
    if (!id) return;
    const before = await menuService.getById(id);
    const ok = await menuService.delete(id);
    if (!ok) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    await logService.create(ctx, {
      action: 'delete',
      module: 'menu',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: id,
      detail: before ? `删除菜单: ${before.title}` : `删除菜单 id: ${id}`
    });
    ctx.body = { message: 'Deleted' };
  }
}

module.exports = new MenuController();
