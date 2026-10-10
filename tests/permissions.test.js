const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const Koa = require('koa');
const { Router } = require('@koa/router');
const jwt = require('jsonwebtoken');
const Admin = require('../app/model/admin');
const Role = require('../app/model/role');
const Permission = require('../app/model/permission');
const requirePermission = require('../app/middleware/requirePermission');
const auth = require('../app/middleware/auth');

const original = { admin: Admin.findById, roles: Role.find, permission: Permission.exists };
after(() => {
  Admin.findById = original.admin;
  Role.find = original.roles;
  Permission.exists = original.permission;
});

let account;
let roles;
let granted;
let lastFilter;
const query = (value) => ({ select: () => ({ lean: async () => value }) });
Admin.findById = () => query(account);
Role.find = () => query(roles);
Permission.exists = async (filter) => {
  lastFilter = filter;
  return granted.some((permission) =>
    filter._id.$in.includes(permission.id) && permission.code === filter.code && permission.type === filter.type
  );
};

function reset() {
  account = { _id: 'account', username: 'staff', roleIds: ['role'], isSuperAdmin: false };
  roles = [{ permissionIds: ['read-id', 'delete-id'] }];
  granted = [];
  lastFilter = null;
}

test('API permissions enforce current account, role, code and type', async (t) => {
  await t.test('missing authentication is 401', async () => {
    reset();
    const ctx = { state: {} };
    await requirePermission('system:user:read')(ctx, () => assert.fail('must not run'));
    assert.equal(ctx.status, 401);
  });
  await t.test('menu permission does not authorize an API', async () => {
    reset();
    granted = [{ id: 'read-id', code: 'system:user:read', type: 'menu' }];
    const ctx = { state: { user: { id: 'account' } } };
    await requirePermission('system:user:read')(ctx, () => assert.fail('must not run'));
    assert.equal(ctx.status, 403);
    assert.equal(ctx.body.permission, 'system:user:read');
  });
  await t.test('read permission allows reading but not deletion', async () => {
    reset();
    granted = [{ id: 'read-id', code: 'system:user:read', type: 'api' }];
    const ctx = { state: { user: { id: 'account' } } };
    let called = false;
    await requirePermission('system:user:read')(ctx, async () => { called = true; });
    assert.equal(called, true);
    assert.deepEqual(lastFilter._id.$in, ['read-id', 'delete-id']);
    await requirePermission('system:user:delete')(ctx, () => assert.fail('must not run'));
    assert.equal(ctx.status, 403);
  });
  await t.test('permissions outside the assigned roles do not authorize', async () => {
    reset();
    granted = [{ id: 'unassigned-id', code: 'system:user:read', type: 'api' }];
    const ctx = { state: { user: { id: 'account' } } };
    await requirePermission('system:user:read')(ctx, () => assert.fail('must not run'));
    assert.equal(ctx.status, 403);
  });
  await t.test('revocation takes effect with the same token claims', async () => {
    reset();
    granted = [{ id: 'read-id', code: 'system:user:read', type: 'api' }];
    const ctx = { state: { user: { id: 'account' } } };
    await requirePermission('system:user:read')(ctx, async () => {});
    roles = [];
    await requirePermission('system:user:read')(ctx, () => assert.fail('must not run'));
    assert.equal(ctx.status, 403);
  });
  await t.test('stale super-admin JWT claim cannot bypass authorization', async () => {
    reset();
    const ctx = { state: { user: { id: 'account', isSuperAdmin: true } } };
    await requirePermission('system:user:delete')(ctx, () => assert.fail('must not run'));
    assert.equal(ctx.status, 403);
  });
  await t.test('database super-admin can access protected operations', async () => {
    reset();
    account.isSuperAdmin = true;
    const ctx = { state: { user: { id: 'account' } } };
    let called = false;
    await requirePermission('system:user:delete')(ctx, async () => { called = true; });
    assert.equal(called, true);
  });
  await t.test('deleted account is 401 even with a valid token', async () => {
    reset();
    account = null;
    const ctx = { state: { user: { id: 'account', isSuperAdmin: true } } };
    await requirePermission('system:user:read')(ctx, () => assert.fail('must not run'));
    assert.equal(ctx.status, 401);
  });
  await t.test('JWT middleware preserves downstream errors', async () => {
    const token = jwt.sign({ id: 'account' }, 'test-secret');
    const ctx = { path: '/api/system/users', headers: { authorization: `Bearer ${token}` }, state: {} };
    await assert.rejects(auth({ secret: 'test-secret' })(ctx, async () => {
      throw new Error('database unavailable');
    }), /database unavailable/);
    assert.notEqual(ctx.status, 401);
  });
  await t.test('initialization is idempotent and preserves existing permission records', async () => {
    const Menu = require('../app/model/menu');
    const permissionService = require('../app/service/permission');
    const catalog = require('../app/lib/apiPermissions');
    const originalFind = Menu.find;
    const originalUpdate = Permission.updateOne;
    const records = new Map([['system:user:read', {
      name: 'Custom name', code: 'system:user:read', type: 'api', menuIds: ['existing-menu']
    }]]);
    Menu.find = () => query([{ _id: 'users-menu', path: '/system/users' }]);
    Permission.updateOne = async (filter, update, options) => {
      assert.equal(options.upsert, true);
      assert.deepEqual(Object.keys(update), ['$setOnInsert']);
      if (!records.has(filter.code)) records.set(filter.code, update.$setOnInsert);
    };
    try {
      await permissionService.ensureApiPermissions();
      await permissionService.ensureApiPermissions();
      assert.equal(records.size, catalog.length);
      assert.equal(records.get('system:user:read').name, 'Custom name');
      assert.deepEqual(records.get('system:user:read').menuIds, ['existing-menu']);
      assert.deepEqual(records.get('system:user:delete').menuIds, ['users-menu']);
      assert.ok([...records.values()].every((record) => record.type === 'api'));
    } finally {
      Menu.find = originalFind;
      Permission.updateOne = originalUpdate;
    }
  });
  await t.test('all registered business routes deny an account without API permissions', async () => {
    reset();
    const router = new Router();
    for (const name of ['system', 'materials', 'user', 'dashboard']) {
      require(`../app/router/modules/${name}`)(router);
    }
    const app = new Koa();
    app.use(async (ctx, next) => {
      ctx.state.user = { id: 'account' };
      await next();
    });
    app.use(router.routes());
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    try {
      for (const route of router.stack) {
        if (route.path === '/api/system/menus/current') continue;
        for (const method of route.methods) {
          const url = `http://127.0.0.1:${server.address().port}${route.path.replace(':id', '507f1f77bcf86cd799439011')}`;
          const response = await fetch(url, { method });
          assert.equal(response.status, 403, `${method} ${route.path}`);
          await response.arrayBuffer();
        }
      }
    } finally {
      await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    }
  });
});
