const materialGroupService = require('../service/materialGroup');
const logService = require('../service/log');
const { ok, reject } = require('../lib/response');

class MaterialGroupController {
  async list(ctx) {
    ok(ctx, await materialGroupService.list());
  }

  async create(ctx) {
    const body = ctx.request.body || {};
    if (!body.name || !String(body.name).trim()) {
      reject(ctx, 400, '分组名称不能为空');
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
    ok(ctx, row);
  }

  async update(ctx) {
    const row = await materialGroupService.update(ctx.params.id, ctx.request.body || {});
    if (!row) {
      reject(ctx, 404, 'Not found');
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
    ok(ctx, row);
  }

  async delete(ctx) {
    const id = ctx.params.id;
    const before = (await materialGroupService.list()).find((g) => g.id === id);
    const deleted = await materialGroupService.delete(id);
    if (!deleted) {
      reject(ctx, 404, 'Not found');
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
    ok(ctx, { message: '删除成功' });
  }
}

module.exports = new MaterialGroupController();
