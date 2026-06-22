module.exports = function registerSystemRoutes(router) {
  const systemUserController = require('../../controller/systemUser');
  const roleController = require('../../controller/role');
  const permissionController = require('../../controller/permission');
  const menuController = require('../../controller/menu');
  const logController = require('../../controller/log');
  const systemSettingController = require('../../controller/systemSetting');

  // 系统设置 - 用户管理（后台账号）
  router.get('/api/system/users', systemUserController.list);
  router.get('/api/system/users/:id', systemUserController.detail);
  router.post('/api/system/users', systemUserController.create);
  router.put('/api/system/users/:id', systemUserController.update);
  router.delete('/api/system/users/:id', systemUserController.delete);

  // 系统设置 - 角色管理
  router.get('/api/system/roles/all', roleController.all);
  router.get('/api/system/roles', roleController.list);
  router.get('/api/system/roles/:id', roleController.detail);
  router.post('/api/system/roles', roleController.create);
  router.put('/api/system/roles/:id', roleController.update);
  router.delete('/api/system/roles/:id', roleController.delete);

  // 系统设置 - 权限管理
  router.get('/api/system/permissions/tree', permissionController.tree);
  router.get('/api/system/permissions', permissionController.list);
  router.get('/api/system/permissions/:id', permissionController.detail);
  router.post('/api/system/permissions', permissionController.create);
  router.put('/api/system/permissions/:id', permissionController.update);
  router.delete('/api/system/permissions/:id', permissionController.delete);

  // 系统设置 - 菜单管理（当前用户菜单需在 :id 前注册）
  router.get('/api/system/menus/current', menuController.current);
  router.get('/api/system/menus/tree', menuController.tree);
  router.get('/api/system/menus', menuController.list);
  router.get('/api/system/menus/:id', menuController.detail);
  router.post('/api/system/menus', menuController.create);
  router.put('/api/system/menus/:id', menuController.update);
  router.delete('/api/system/menus/:id', menuController.delete);

  // 系统设置 - 操作日志（仅超级管理员）
  router.get('/api/system/logs', logController.list);

  // 系统设置 - 文件存储配置（本地 / 七牛云）
  router.get('/api/system/storage', systemSettingController.getStorage);
  router.put('/api/system/storage', systemSettingController.saveStorage);
};

