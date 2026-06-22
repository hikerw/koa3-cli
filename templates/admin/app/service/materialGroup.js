const MaterialGroup = require('../model/materialGroup');
const Material = require('../model/material');

class MaterialGroupService {
  async list() {
    const items = await MaterialGroup.find().sort({ order: -1, createdAt: -1 });
    return items.map((d) => d.toJSON());
  }

  async create({ name, order = 0 }) {
    const doc = await MaterialGroup.create({
      name: (name || '').trim(),
      order: Number(order) || 0
    });
    return doc.toJSON();
  }

  async update(id, { name, order }) {
    const doc = await MaterialGroup.findById(id);
    if (!doc) return null;
    if (name !== undefined) doc.name = String(name).trim();
    if (order !== undefined) doc.order = Number(order) || 0;
    await doc.save();
    return doc.toJSON();
  }

  async delete(id) {
    const res = await MaterialGroup.findByIdAndDelete(id);
    if (!res) return false;
    await Material.updateMany({ groupId: id }, { $set: { groupId: null } });
    return true;
  }
}

module.exports = new MaterialGroupService();
