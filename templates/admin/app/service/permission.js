const Permission = require('../model/permission');

function toTree(list, parentId = null) {
  return list
    .filter((p) => (parentId == null ? !p.parentId : p.parentId === parentId))
    .map((p) => ({
      ...p,
      children: toTree(list, p.id)
    }))
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
}

class PermissionService {
  async getList({ page = 1, pageSize = 500, keyword = '', tree = false } = {}) {
    const filter = {};
    if (keyword && keyword.trim()) {
      filter.$or = [
        { name: { $regex: keyword.trim(), $options: 'i' } },
        { code: { $regex: keyword.trim(), $options: 'i' } }
      ];
    }
    const [items, total] = await Promise.all([
      Permission.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      Permission.countDocuments(filter)
    ]);
    const list = items.map((d) => d.toJSON());
    if (tree) {
      const all = await Permission.find(filter).sort({ createdAt: 1 });
      const flat = all.map((d) => d.toJSON());
      return { list: toTree(flat), total };
    }
    return { list, total };
  }

  async getById(id) {
    const doc = await Permission.findById(id);
    return doc ? doc.toJSON() : null;
  }

  async create({ name, code, type = 'api', parentId, description = '', menuIds = [] }) {
    const doc = await Permission.create({
      name: (name || '').trim(),
      code: (code || '').trim(),
      type: type || 'api',
      parentId: parentId || null,
      description: (description || '').trim(),
      menuIds: Array.isArray(menuIds) ? menuIds : []
    });
    return doc.toJSON();
  }

  async update(id, { name, code, type, parentId, description, menuIds }) {
    const doc = await Permission.findById(id);
    if (!doc) return null;
    if (name !== undefined) doc.name = name.trim();
    if (code !== undefined) doc.code = code.trim();
    if (type !== undefined) doc.type = type;
    if (parentId !== undefined) doc.parentId = parentId || null;
    if (description !== undefined) doc.description = description.trim();
    if (menuIds !== undefined) doc.menuIds = Array.isArray(menuIds) ? menuIds : [];
    await doc.save();
    return doc.toJSON();
  }

  async delete(id) {
    const res = await Permission.findByIdAndDelete(id);
    return !!res;
  }

  async getTree() {
    const all = await Permission.find().sort({ createdAt: 1 });
    return toTree(all.map((d) => d.toJSON()));
  }
}

module.exports = new PermissionService();
