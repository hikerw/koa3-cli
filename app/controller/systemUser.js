const systemUserService = require('../service/systemUser');
const logService = require('../service/log');

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
    const body = ctx.request.body || {};
    const { username, password, roleIds } = body;
    if (!username || !password) {
      ctx.throw(400, '用户名和密码不能为空');
    }
    const user = await systemUserService.create({ username, password, roleIds: roleIds || [] });
    await logService.create(ctx, {
      action: 'create',
      module: 'system_user',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: user?.id,
      detail: `新增用户: ${username}`
    });
    ctx.status = 201;
    ctx.body = user;
  }

  async update(ctx) {
    const user = await systemUserService.update(ctx.params.id, ctx.request.body || {});
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
