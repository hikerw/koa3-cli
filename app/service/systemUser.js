const bcrypt = require('bcryptjs');
const Admin = require('../model/admin');

async function hashPassword(raw) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(raw, salt);
}

class SystemUserService {
  async getList({ page = 1, pageSize = 10, keyword = '' } = {}) {
    const skip = (page - 1) * pageSize;
    const filter = {};
    if (keyword && keyword.trim()) {
      filter.username = { $regex: keyword.trim(), $options: 'i' };
    }
    const [items, total] = await Promise.all([
      Admin.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      Admin.countDocuments(filter)
    ]);
    const list = items.map((doc) => {
      const o = { id: doc._id.toString(), username: doc.username, roleIds: (doc.roleIds || []).map((r) => r.toString()), createdAt: doc.createdAt, updatedAt: doc.updatedAt };
      return o;
    });
    return { list, total };
  }

  async getById(id) {
    const doc = await Admin.findById(id).lean();
    if (!doc) return null;
    return { id: doc._id.toString(), username: doc.username, roleIds: (doc.roleIds || []).map((r) => r.toString()), createdAt: doc.createdAt, updatedAt: doc.updatedAt };
  }

  async create({ username, password, roleIds = [] }) {
    const usernameNorm = username.trim().toLowerCase();
    const exist = await Admin.findOne({ username: usernameNorm });
    if (exist) {
      const err = new Error('用户名已存在');
      err.status = 400;
      throw err;
    }
    const hashed = await hashPassword(password);
    const doc = await Admin.create({ username: usernameNorm, password: hashed, roleIds: roleIds.length ? roleIds : [] });
    return doc.toJSON();
  }

  async update(id, { username, password, roleIds }) {
    const doc = await Admin.findById(id);
    if (!doc) return null;
    if (username !== undefined) doc.username = username.trim().toLowerCase();
    if (password !== undefined && password !== '') doc.password = await hashPassword(password);
    if (roleIds !== undefined) doc.roleIds = roleIds || [];
    await doc.save();
    return doc.toJSON();
  }

  async delete(id) {
    const res = await Admin.findByIdAndDelete(id);
    return !!res;
  }
}

module.exports = new SystemUserService();
