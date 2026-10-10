module.exports = function registerSystemRoutes(router) {
  const permit = require('../../middleware/requirePermission');
  const systemUserController = require('../../controller/systemUser');
  const roleController = require('../../controller/role');
  const permissionController = require('../../controller/permission');
  const menuController = require('../../controller/menu');
  const logController = require('../../controller/log');
  const systemSettingController = require('../../controller/systemSetting');

  // 系统设置 - 用户管理（后台账号）
  router.get('/api/system/users', permit('system:user:read'), systemUserController.list);
  router.get('/api/system/users/:id', permit('system:user:read'), systemUserController.detail);
  router.post('/api/system/users', permit('system:user:create'), systemUserController.create);
  router.put('/api/system/users/:id', permit('system:user:update'), systemUserController.update);
  router.delete('/api/system/users/:id', permit('system:user:delete'), systemUserController.delete);

  // 系统设置 - 角色管理
  router.get('/api/system/roles/all', permit('system:role:read'), roleController.all);
  router.get('/api/system/roles', permit('system:role:read'), roleController.list);
  router.get('/api/system/roles/:id', permit('system:role:read'), roleController.detail);
  router.post('/api/system/roles', permit('system:role:create'), roleController.create);
  router.put('/api/system/roles/:id', permit('system:role:update'), roleController.update);
  router.delete('/api/system/roles/:id', permit('system:role:delete'), roleController.delete);

  // 系统设置 - 权限管理
  router.get('/api/system/permissions/tree', permit('system:permission:read'), permissionController.tree);
  router.get('/api/system/permissions', permit('system:permission:read'), permissionController.list);
  router.get('/api/system/permissions/:id', permit('system:permission:read'), permissionController.detail);
  router.post('/api/system/permissions', permit('system:permission:create'), permissionController.create);
  router.put('/api/system/permissions/:id', permit('system:permission:update'), permissionController.update);
  router.delete('/api/system/permissions/:id', permit('system:permission:delete'), permissionController.delete);

  // 系统设置 - 菜单管理（当前用户菜单需在 :id 前注册）
  router.get('/api/system/menus/current', menuController.current);
  router.get('/api/system/menus/tree', permit('system:menu:read'), menuController.tree);
  router.get('/api/system/menus', permit('system:menu:read'), menuController.list);
  router.get('/api/system/menus/:id', permit('system:menu:read'), menuController.detail);
  router.post('/api/system/menus', permit('system:menu:create'), menuController.create);
  router.put('/api/system/menus/:id', permit('system:menu:update'), menuController.update);
  router.delete('/api/system/menus/:id', permit('system:menu:delete'), menuController.delete);

  // 系统设置 - 操作日志
  router.get('/api/system/logs', permit('system:log:read'), logController.list);

  // 系统设置 - 文件存储配置（本地 / 七牛云）
  router.get('/api/system/storage', permit('system:storage:read'), systemSettingController.getStorage);
  router.put('/api/system/storage', permit('system:storage:update'), systemSettingController.saveStorage);
};

