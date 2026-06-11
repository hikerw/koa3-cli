const Menu = require('../model/menu');
const Admin = require('../model/admin');
const Role = require('../model/role');
const Permission = require('../model/permission');

function toTree(list, parentId = null) {
  return list
    .filter((m) => (parentId == null ? !m.parentId : m.parentId === parentId))
    .map((m) => ({
      ...m,
      children: toTree(list, m.id)
    }))
    .sort((a, b) => (a.order !== b.order ? a.order - b.order : (a.createdAt > b.createdAt ? 1 : -1)));
}

class MenuService {
  async getList({ page = 1, pageSize = 500, keyword = '', tree = false } = {}) {
    const filter = {};
    if (keyword && keyword.trim()) {
      filter.$or = [
        { title: { $regex: keyword.trim(), $options: 'i' } },
        { path: { $regex: keyword.trim(), $options: 'i' } }
      ];
    }
    const [items, total] = await Promise.all([
      Menu.find(filter).sort({ order: 1, createdAt: 1 }).skip((page - 1) * pageSize).limit(pageSize),
      Menu.countDocuments(filter)
    ]);
    const list = items.map((d) => d.toJSON());
    if (tree) {
      const all = await Menu.find(filter).sort({ order: 1, createdAt: 1 });
      const flat = all.map((d) => d.toJSON());
      return { list: toTree(flat), total };
    }
    return { list, total };
  }

  async getById(id) {
    const doc = await Menu.findById(id);
    return doc ? doc.toJSON() : null;
  }

  async create({ title, path = '', icon = '', parentId, order = 0, permissionCode = '' }) {
    const doc = await Menu.create({
      title: (title || '').trim(),
      path: (path || '').trim(),
      icon: (icon || '').trim(),
      parentId: parentId || null,
      order: Number(order) || 0,
      permissionCode: (permissionCode || '').trim()
    });
    return doc.toJSON();
  }

  async update(id, { title, path, icon, parentId, order, permissionCode }) {
    const doc = await Menu.findById(id);
    if (!doc) return null;
    if (title !== undefined) doc.title = title.trim();
    if (path !== undefined) doc.path = path.trim();
    if (icon !== undefined) doc.icon = icon.trim();
    if (parentId !== undefined) doc.parentId = parentId || null;
    if (order !== undefined) doc.order = Number(order) || 0;
    if (permissionCode !== undefined) doc.permissionCode = permissionCode.trim();
    await doc.save();
    return doc.toJSON();
  }

  async delete(id) {
    const res = await Menu.findByIdAndDelete(id);
    return !!res;
  }

  async getTree() {
    const all = await Menu.find().sort({ order: 1, createdAt: 1 });
    return toTree(all.map((d) => d.toJSON()));
  }

  /**
   * 根据当前管理员权限返回可见菜单树（后端权限控制）
   * 权限可勾选「可访问的菜单」(menuIds)，角色绑定权限；用户可见 = 其角色下所有权限的 menuIds 并集
   * 超级管理员返回全部菜单
   */
  async getTreeForUser(adminId) {
    const admin = await Admin.findById(adminId).lean();
    if (!admin) return [];

    const allMenus = await Menu.find().sort({ order: 1, createdAt: 1 }).lean();
    const list = allMenus.map((d) => ({
      id: d._id.toString(),
      parentId: d.parentId ? d.parentId.toString() : null,
      title: d.title,
      path: d.path,
      icon: d.icon,
      order: d.order
    }));

    if (admin.isSuperAdmin) {
      return toTree(list);
    }

    const roleIds = admin.roleIds || [];
    const allowedMenuIds = new Set();
    if (roleIds.length > 0) {
      const roles = await Role.find({ _id: { $in: roleIds } }).select('permissionIds').lean();
      const permIds = roles.flatMap((r) => r.permissionIds || []);
      if (permIds.length > 0) {
        const perms = await Permission.find({ _id: { $in: permIds } }).select('menuIds').lean();
        perms.forEach((p) => {
          (p.menuIds || []).forEach((mid) => allowedMenuIds.add(mid.toString()));
        });
      }
    }

    const allowedIds = new Set();
    for (const m of list) {
      if (allowedMenuIds.has(m.id)) {
        allowedIds.add(m.id);
        let pid = m.parentId;
        while (pid) {
          allowedIds.add(pid);
          const parent = list.find((x) => x.id === pid);
          pid = parent ? parent.parentId : null;
        }
      }
    }
    const filtered = list.filter((m) => allowedIds.has(m.id));
    return toTree(filtered);
  }

  /**
   * 若数据库中没有系统设置相关菜单，则插入默认菜单数据，并创建对应权限（权限勾选可访问的菜单，再赋给角色）
   */
  async ensureDefaultMenus() {
    const hasSystem = await Menu.findOne({ path: '/system' });
    if (hasSystem) return;

    const Permission = require('../model/permission');

    const home = await Menu.create({ title: '首页', path: '/', icon: 'UserFilled', order: 0 });
    const systemParent = await Menu.create({ title: '系统设置', path: '/system', icon: 'Setting', order: 1 });
    const c1 = await Menu.create({ title: '用户管理', path: '/system/users', icon: 'User', order: 1, parentId: systemParent._id });
    const c2 = await Menu.create({ title: '角色管理', path: '/system/roles', icon: 'Key', order: 2, parentId: systemParent._id });
    const c3 = await Menu.create({ title: '权限管理', path: '/system/permissions', icon: 'Lock', order: 3, parentId: systemParent._id });
    const c4 = await Menu.create({ title: '菜单管理', path: '/system/menus', icon: 'Menu', order: 4, parentId: systemParent._id });
    const c5 = await Menu.create({ title: '存储配置', path: '/system/storage', icon: 'Setting', order: 6, parentId: systemParent._id });

    if (!(await Permission.findOne({ code: 'home:access' }))) {
      await Permission.create({ name: '首页', code: 'home:access', type: 'menu', menuIds: [home._id] });
    }
    if (!(await Permission.findOne({ code: 'system:access' }))) {
      await Permission.create({
        name: '系统设置',
        code: 'system:access',
        type: 'menu',
        menuIds: [systemParent._id, c1._id, c2._id, c3._id, c4._id, c5._id]
      });
    }
    console.log('[Menu] 默认菜单已初始化：首页、系统设置及子菜单；已创建权限「首页」「系统设置」（可赋给角色以控制菜单可见）');
  }

  /**
   * 若没有「操作日志」菜单则创建并加入系统设置权限（兼容已有数据库）
   */
  async ensureLogsMenu() {
    const exists = await Menu.findOne({ path: '/system/logs' });
    if (exists) return;
    const systemParent = await Menu.findOne({ path: '/system', parentId: null });
    if (!systemParent) return;
    const Permission = require('../model/permission');
    const logsMenu = await Menu.create({
      title: '操作日志',
      path: '/system/logs',
      icon: 'Document',
      order: 5,
      parentId: systemParent._id
    });
    const perm = await Permission.findOne({ code: 'system:access' });
    if (perm) {
      perm.menuIds = perm.menuIds || [];
      if (!perm.menuIds.some((id) => id.toString() === logsMenu._id.toString())) {
        perm.menuIds.push(logsMenu._id);
        await perm.save();
      }
    }
    console.log('[Menu] 已添加「操作日志」菜单');
  }

  /**
   * 若没有「存储配置」菜单则创建并加入系统设置权限。
   * 该页面控制上传文件落本地还是七牛云，必须放到系统设置里，避免普通业务菜单误操作。
   */
  async ensureStorageMenu() {
    const exists = await Menu.findOne({ path: '/system/storage' });
    if (exists) return;
    const systemParent = await Menu.findOne({ path: '/system', parentId: null });
    if (!systemParent) return;
    const storageMenu = await Menu.create({
      title: '存储配置',
      path: '/system/storage',
      icon: 'Setting',
      order: 6,
      parentId: systemParent._id
    });
    const perm = await Permission.findOne({ code: 'system:access' });
    if (perm) {
      perm.menuIds = perm.menuIds || [];
      if (!perm.menuIds.some((id) => id.toString() === storageMenu._id.toString())) {
        perm.menuIds.push(storageMenu._id);
        await perm.save();
      }
    }
    console.log('[Menu] 已添加「存储配置」菜单');
  }

  /**
   * 若没有「素材管理」菜单则创建，并增加权限 material:access（兼容已有数据库）
   */
  async ensureMaterialsMenu() {
    const exists = await Menu.findOne({ path: '/materials' });
    if (exists) return;
    const materialMenu = await Menu.create({
      title: '素材管理',
      path: '/materials',
      icon: 'Picture',
      order: 2
    });
    const Permission = require('../model/permission');
    if (!(await Permission.findOne({ code: 'material:access' }))) {
      await Permission.create({
        name: '素材管理',
        code: 'material:access',
        type: 'menu',
        menuIds: [materialMenu._id]
      });
    }
    console.log('[Menu] 已添加「素材管理」菜单与权限 material:access');
  }
}

module.exports = new MenuService();
