const roleService = require('../service/role');
const logService = require('../service/log');

class RoleController {
  async list(ctx) {
    const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(ctx.query.pageSize, 10) || 100));
    const keyword = ctx.query.keyword || '';
    const result = await roleService.getList({ page, pageSize, keyword });
    ctx.body = result;
  }

  async all(ctx) {
    const list = await roleService.getAll();
    ctx.body = list;
  }

  async detail(ctx) {
    const role = await roleService.getById(ctx.params.id);
    if (!role) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    ctx.body = role;
  }

  async create(ctx) {
    const body = ctx.request.body || {};
    const role = await roleService.create(body);
    await logService.create(ctx, {
      action: 'create',
      module: 'role',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: role?.id,
      detail: `新增角色: ${role?.name || ''}`
    });
    ctx.status = 201;
    ctx.body = role;
  }

  async update(ctx) {
    const role = await roleService.update(ctx.params.id, ctx.request.body || {});
    if (!role) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
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
    ctx.body = role;
  }

  async delete(ctx) {
    const id = ctx.params.id;
    const before = await roleService.getById(id);
    const ok = await roleService.delete(id);
    if (!ok) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
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
    ctx.body = { message: 'Deleted' };
  }
}

module.exports = new RoleController();
