const Role = require('../model/role');

class RoleService {
  async getList({ page = 1, pageSize = 100, keyword = '' } = {}) {
    const skip = (page - 1) * pageSize;
    const filter = {};
    if (keyword && keyword.trim()) {
      filter.$or = [
        { name: { $regex: keyword.trim(), $options: 'i' } },
        { code: { $regex: keyword.trim(), $options: 'i' } }
      ];
    }
    const [items, total] = await Promise.all([
      Role.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate('permissionIds', 'id name code type'),
      Role.countDocuments(filter)
    ]);
    const list = items.map((doc) => {
      const j = doc.toJSON();
      if (j.permissionIds && j.permissionIds.length) j.permissionIds = j.permissionIds.map((p) => (typeof p === 'object' && p.id ? p.id : p));
      return j;
    });
    return { list, total };
  }

  async getById(id) {
    const doc = await Role.findById(id).populate('permissionIds', 'id name code type');
    if (!doc) return null;
    const j = doc.toJSON();
    if (j.permissionIds && j.permissionIds.length) j.permissionIds = j.permissionIds.map((p) => (typeof p === 'object' && p.id ? p.id : p));
    return j;
  }

  async create({ name, code, permissionIds = [], description = '' }) {
    const exist = await Role.findOne({ code: (code || '').trim().toUpperCase() });
    if (exist) {
      const err = new Error('角色编码已存在');
      err.status = 400;
      throw err;
    }
    const doc = await Role.create({
      name: (name || '').trim(),
      code: (code || '').trim().toUpperCase(),
      permissionIds: permissionIds || [],
      description: (description || '').trim()
    });
    return doc.toJSON();
  }

  async update(id, { name, code, permissionIds, description }) {
    const doc = await Role.findById(id);
    if (!doc) return null;
    if (name !== undefined) doc.name = name.trim();
    if (code !== undefined) doc.code = code.trim().toUpperCase();
    if (permissionIds !== undefined) doc.permissionIds = permissionIds || [];
    if (description !== undefined) doc.description = description.trim();
    await doc.save();
    return doc.toJSON();
  }

  async delete(id) {
    const res = await Role.findByIdAndDelete(id);
    return !!res;
  }

  async getAll() {
    const items = await Role.find().sort({ createdAt: -1 });
    return items.map((d) => d.toJSON());
  }
}

module.exports = new RoleService();
