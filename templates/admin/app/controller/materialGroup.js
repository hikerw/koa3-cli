const materialGroupService = require('../service/materialGroup');
const logService = require('../service/log');

class MaterialGroupController {
  async list(ctx) {
    ctx.body = await materialGroupService.list();
  }

  async create(ctx) {
    const body = ctx.request.body || {};
    if (!body.name || !String(body.name).trim()) {
      ctx.status = 400;
      ctx.body = { message: '分组名称不能为空' };
      return;
    }
    const row = await materialGroupService.create(body);
    await logService.create(ctx, {
      action: 'create',
      module: 'material_group',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: row?.id,
      detail: `新增素材分组: ${row?.name || ''}`
    });
    ctx.status = 201;
    ctx.body = row;
  }

  async update(ctx) {
    const row = await materialGroupService.update(ctx.params.id, ctx.request.body || {});
    if (!row) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    await logService.create(ctx, {
      action: 'update',
      module: 'material_group',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: row.id,
      detail: `更新素材分组: ${row.name || ''}`
    });
    ctx.body = row;
  }

  async delete(ctx) {
    const id = ctx.params.id;
    const before = (await materialGroupService.list()).find((g) => g.id === id);
    const ok = await materialGroupService.delete(id);
    if (!ok) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    await logService.create(ctx, {
      action: 'delete',
      module: 'material_group',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: id,
      detail: before ? `删除素材分组: ${before.name}` : `删除素材分组 id: ${id}`
    });
    ctx.body = { message: '删除成功' };
  }
}

module.exports = new MaterialGroupController();
