const menuService = require('../service/menu');
const logService = require('../service/log');

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
    const menu = await menuService.getById(ctx.params.id);
    if (!menu) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    ctx.body = menu;
  }

  async create(ctx) {
    const menu = await menuService.create(ctx.request.body || {});
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
    const menu = await menuService.update(ctx.params.id, ctx.request.body || {});
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
    const id = ctx.params.id;
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
