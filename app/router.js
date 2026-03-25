const { Router } = require('@koa/router');

const router = new Router();

// 加载控制器
const homeController = require('./controller/home');
const dashboardController = require('./controller/dashboard');
const userController = require('./controller/user');
const adminController = require('./controller/admin');
const systemUserController = require('./controller/systemUser');
const roleController = require('./controller/role');
const permissionController = require('./controller/permission');
const menuController = require('./controller/menu');
const logController = require('./controller/log');
const materialController = require('./controller/material');
const materialGroupController = require('./controller/materialGroup');

// 路由配置
// 首页
router.get('/', homeController.index);

// 管理员登录
router.post('/api/admin/login', adminController.login);

// 仪表盘统计
router.get('/api/dashboard/stats', dashboardController.stats);

// 用户相关路由（业务用户）
router.get('/api/user', userController.list);
router.get('/api/user/:id', userController.detail);
router.post('/api/user', userController.create);
router.put('/api/user/:id', userController.update);
router.delete('/api/user/:id', userController.delete);

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

// 素材分组
router.get('/api/material-groups', materialGroupController.list);
router.post('/api/material-groups', materialGroupController.create);
router.put('/api/material-groups/:id', materialGroupController.update);
router.delete('/api/material-groups/:id', materialGroupController.delete);

// 素材管理（upload / 秒传 须在 :id 之前）
router.post('/api/materials/bulk-delete', materialController.bulkDelete);
router.post('/api/materials/bulk-group', materialController.bulkGroup);
router.get('/api/materials', materialController.list);
router.post('/api/materials/check-hash', materialController.checkHash);
router.post('/api/materials/instant', materialController.instant);
router.post('/api/materials/upload', materialController.upload);
router.get('/api/materials/:id', materialController.detail);
router.post('/api/materials', materialController.create);
router.put('/api/materials/:id', materialController.update);
router.delete('/api/materials/:id', materialController.delete);

module.exports = router;

