const permissionService = require('../service/permission');
const logService = require('../service/log');

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
    const perm = await permissionService.create(ctx.request.body || {});
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
    const perm = await permissionService.update(ctx.params.id, ctx.request.body || {});
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
