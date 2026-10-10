// Fixed API codes are shared by route guards and permission initialization.
const resources = [
  ['system:user', '后台用户', '/system/users', ['read', 'create', 'update', 'delete']],
  ['system:role', '角色', '/system/roles', ['read', 'create', 'update', 'delete']],
  ['system:permission', '权限', '/system/permissions', ['read', 'create', 'update', 'delete']],
  ['system:menu', '菜单', '/system/menus', ['read', 'create', 'update', 'delete']],
  ['system:log', '操作日志', '/system/logs', ['read']],
  ['system:storage', '存储配置', '/system/storage', ['read', 'update']],
  ['material', '素材', '/materials', ['read', 'create', 'update', 'delete', 'upload']],
  ['material-group', '素材分组', '/materials', ['read', 'create', 'update', 'delete']],
  ['user', '业务用户', '/', ['read', 'create', 'update', 'delete']],
  ['dashboard', '仪表盘', '/', ['read']]
];
const actions = { read: '查看', create: '新增', update: '修改', delete: '删除', upload: '上传或替换文件' };

module.exports = resources.flatMap(([prefix, name, menuPath, allowedActions]) =>
  allowedActions.map((action) => ({
    code: `${prefix}:${action}`,
    name: `${name}：${actions[action]}`,
    menuPath
  }))
);
