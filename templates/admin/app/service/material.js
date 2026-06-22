const path = require('path');
const fs = require('fs/promises');
const { mongoose } = require('../model/db');
const Material = require('../model/material');
const { md5FileHex, normalizeMd5 } = require('../lib/fileMd5');
const storageService = require('./storage');
const { buildMaterialUsageMap, normalizeMaterialUrl } = require('./materialUsage');

function resolveGroupIdForCreate(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!s || !mongoose.isValidObjectId(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

function buildUsageError(doc, usage) {
  const err = new Error(`素材正在被使用，不能删除或替换：${doc?.name || doc?.url || ''}`);
  err.status = 409;
  err.code = 'MATERIAL_IN_USE';
  err.usageCount = usage?.usageCount || 0;
  err.usageRefs = usage?.usageRefs || [];
  return err;
}

class MaterialService {
  /**
   * 给素材记录附加业务引用状态。
   *
   * 脚手架默认没有业务引用来源，返回的 inUse 会是 false；业务模块通过 materialUsage 服务注册
   * 引用来源后，这里会自动把使用位置带给前端，用于提示和危险操作拦截。
   */
  async attachUsage(items = []) {
    const rows = items.map((item) => (typeof item.toJSON === 'function' ? item.toJSON() : item));
    const usageMap = await buildMaterialUsageMap(rows.map((row) => row.url));
    return rows.map((row) => {
      const refs = usageMap.get(normalizeMaterialUrl(row.url)) || [];
      return {
        ...row,
        inUse: refs.length > 0,
        usageCount: refs.length,
        usageRefs: refs.slice(0, 20)
      };
    });
  }

  /**
   * 删除或替换素材文件前的后端兜底保护。
   *
   * 一旦素材 URL 已被业务表引用，直接删除或换文件会让页面图片/附件失效，所以必须在服务层
   * 做最终校验，不能只依赖前端按钮状态。
   */
  async assertMaterialNotInUse(doc) {
    const [usage] = await this.attachUsage([doc]);
    if (usage?.inUse) throw buildUsageError(doc, usage);
    return usage;
  }

  /**
   * group: all | none | MongoId
   * typeTab: image | video | other（其它=音频+文档+其它）| 或旧版单值 type
   * name / keyword：名称、描述、标签；url：URL 片段
   */
  async getList({
    page = 1,
    pageSize = 50,
    name = '',
    url: urlKeyword = '',
    keyword = '',
    typeTab = '',
    type = '',
    group = 'all'
  } = {}) {
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 50));
    const skip = (Math.max(1, Number(page) || 1) - 1) * safePageSize;
    const filter = {};
    const andParts = [];

    const nameQ = String(name || keyword || '').trim();
    if (nameQ) {
      andParts.push({
        $or: [
          { name: { $regex: nameQ, $options: 'i' } },
          { description: { $regex: nameQ, $options: 'i' } },
          { tags: { $regex: nameQ, $options: 'i' } }
        ]
      });
    }
    const urlQ = String(urlKeyword || '').trim();
    if (urlQ) andParts.push({ url: { $regex: urlQ, $options: 'i' } });

    const tab = String(typeTab || type || '').trim();
    if (tab === 'image') andParts.push({ type: 'image' });
    else if (tab === 'video') andParts.push({ type: 'video' });
    else if (tab === 'other') andParts.push({ type: { $in: ['audio', 'file', 'other'] } });
    else if (tab && ['image', 'video', 'audio', 'file', 'other'].includes(tab)) andParts.push({ type: tab });

    const g = String(group || 'all').trim();
    if (g === 'none') {
      andParts.push({ $or: [{ groupId: null }, { groupId: { $exists: false } }] });
    } else if (g !== 'all' && mongoose.isValidObjectId(g)) {
      andParts.push({ groupId: new mongoose.Types.ObjectId(g) });
    }

    if (andParts.length) filter.$and = andParts;

    const [items, total] = await Promise.all([
      Material.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safePageSize),
      Material.countDocuments(filter)
    ]);
    return { list: await this.attachUsage(items), total };
  }

  async getById(id) {
    const doc = await Material.findById(id);
    if (!doc) return null;
    const [row] = await this.attachUsage([doc]);
    return row;
  }

  async findFirstByContent(hash, size) {
    const h = normalizeMd5(hash);
    const sz = Number(size);
    if (!h || Number.isNaN(sz) || sz < 0) return null;
    const doc = await Material.findOne({ fileHash: h, size: sz }).sort({ createdAt: 1 }).lean();
    return doc;
  }

  async checkContentHit(fileHash, size) {
    const src = await this.findFirstByContent(fileHash, size);
    if (!src) return { hit: false };
    return {
      hit: true,
      url: src.url,
      type: src.type,
      mimeType: src.mimeType || '',
      size: src.size,
      thumbnail: src.thumbnail || '',
      storageDriver: src.storageDriver || 'local'
    };
  }

  async createFromInstant({ fileHash, size, name, description, tags, groupId }) {
    const h = normalizeMd5(fileHash);
    const sz = Number(size);
    if (!h || Number.isNaN(sz) || sz < 0) {
      const err = new Error('无效的 md5 或文件大小');
      err.status = 400;
      throw err;
    }
    const src = await this.findFirstByContent(h, sz);
    if (!src || !src.url) {
      const err = new Error('未找到相同文件，请完整上传');
      err.status = 404;
      throw err;
    }
    const base =
      (name || '').trim() ||
      path.parse(String(src.url || '').split('/').pop() || 'file').name ||
      '未命名素材';
    return this.create({
      name: base,
      url: src.url,
      type: src.type,
      mimeType: src.mimeType || '',
      size: src.size,
      thumbnail: src.thumbnail || '',
      storageDriver: src.storageDriver || 'local',
      description: (description || '').trim(),
      tags: Array.isArray(tags) ? tags : [],
      fileHash: h,
      groupId
    });
  }

  async replaceFromInstant(id, { fileHash, size, name, description, tags, groupId }, uploadCfg, rootDir) {
    const h = normalizeMd5(fileHash);
    const sz = Number(size);
    if (!h || Number.isNaN(sz) || sz < 0) {
      const err = new Error('无效的 md5 或文件大小');
      err.status = 400;
      throw err;
    }
    const src = await this.findFirstByContent(h, sz);
    if (!src || !src.url) return null;
    const doc = await Material.findById(id);
    if (!doc) return null;
    await this.assertMaterialNotInUse(doc);
    const oldUrl = doc.url;
    const oldDriver = doc.storageDriver || 'local';
    if (name !== undefined && String(name).trim()) doc.name = String(name).trim();
    if (description !== undefined) doc.description = String(description).trim();
    if (tags !== undefined) {
      doc.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
    }
    doc.url = src.url;
    doc.type = src.type;
    doc.mimeType = src.mimeType || '';
    doc.size = src.size;
    doc.thumbnail = src.thumbnail || '';
    doc.storageDriver = src.storageDriver || 'local';
    doc.fileHash = h;
    await doc.save();
    const leftOld = await Material.countDocuments({ url: oldUrl });
    if (leftOld === 0 && rootDir) {
      await storageService.removeStoredFile(oldUrl, rootDir, { driver: oldDriver }).catch(() => {});
    }
    return doc.toJSON();
  }

  async persistUploadedFile(fileMeta, _uploadCfg, rootDir) {
    return storageService.saveUploadedFile(fileMeta, rootDir);
  }

  async createFromUpload({ fileMeta, name, description, tags, groupId }, uploadCfg, rootDir) {
    let persisted = null;
    try {
      const fileHash = await md5FileHex(fileMeta.tempPath);
      const size = Number(fileMeta.size) >= 0 ? Number(fileMeta.size) : 0;
      const dup = await Material.findOne({ fileHash, size }).lean();
      const base =
        (name || '').trim() ||
        path.parse(String(fileMeta.originalFilename || '').trim() || 'file').name ||
        '未命名素材';
      if (dup?.url) {
        await fs.unlink(fileMeta.tempPath).catch(() => {});
        return await this.create({
          name: base,
          url: dup.url,
          type: dup.type,
          mimeType: dup.mimeType || '',
          size: dup.size,
          thumbnail: dup.thumbnail || '',
          storageDriver: dup.storageDriver || 'local',
          description: (description || '').trim(),
          tags: Array.isArray(tags) ? tags : [],
          fileHash,
          groupId: resolveGroupIdForCreate(groupId)
        });
      }

      persisted = await this.persistUploadedFile(fileMeta, uploadCfg, rootDir);
      delete persisted._localPath;
      return await this.create({
        name: base,
        ...persisted,
        description: (description || '').trim(),
        tags: Array.isArray(tags) ? tags : [],
        fileHash,
        groupId: resolveGroupIdForCreate(groupId)
      });
    } catch (e) {
      if (persisted?.url) await storageService.removeStoredFile(persisted.url, rootDir).catch(() => {});
      else if (fileMeta?.tempPath) await fs.unlink(fileMeta.tempPath).catch(() => {});
      throw e;
    }
  }

  async replaceWithUpload(id, { fileMeta, name, description, tags, groupId }, uploadCfg, rootDir) {
    const doc = await Material.findById(id);
    if (!doc) return null;
    let persisted = null;
    const oldUrl = doc.url;
    const oldDriver = doc.storageDriver || 'local';
    try {
      await this.assertMaterialNotInUse(doc);
      const fileHash = await md5FileHex(fileMeta.tempPath);
      const size = Number(fileMeta.size) >= 0 ? Number(fileMeta.size) : 0;
      const dup = await Material.findOne({ fileHash, size }).lean();
      let rest;
      if (dup?.url) {
        await fs.unlink(fileMeta.tempPath).catch(() => {});
        rest = {
          url: dup.url,
          type: dup.type,
          mimeType: dup.mimeType || '',
          size: dup.size,
          thumbnail: dup.thumbnail || '',
          storageDriver: dup.storageDriver || 'local',
          fileHash
        };
      } else {
        persisted = await this.persistUploadedFile(fileMeta, uploadCfg, rootDir);
        delete persisted._localPath;
        rest = { ...persisted, fileHash };
      }
      if (name !== undefined && String(name).trim()) doc.name = String(name).trim();
      if (description !== undefined) doc.description = String(description).trim();
      if (tags !== undefined) {
        doc.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
      }
      Object.assign(doc, rest);
      if (groupId !== undefined) doc.groupId = resolveGroupIdForCreate(groupId);
      await doc.save();

      const leftOld = await Material.countDocuments({ url: oldUrl });
      if (leftOld === 0) await storageService.removeStoredFile(oldUrl, rootDir, { driver: oldDriver }).catch(() => {});

      return doc.toJSON();
    } catch (e) {
      if (persisted?.url) await storageService.removeStoredFile(persisted.url, rootDir).catch(() => {});
      else if (fileMeta?.tempPath) await fs.unlink(fileMeta.tempPath).catch(() => {});
      throw e;
    }
  }

  async create(payload) {
    const gid = resolveGroupIdForCreate(payload.groupId);
    const doc = await Material.create({
      groupId: gid,
      name: (payload.name || '').trim(),
      type: payload.type || 'other',
      url: (payload.url || '').trim(),
      thumbnail: (payload.thumbnail || '').trim(),
      storageDriver: payload.storageDriver === 'qiniu' ? 'qiniu' : 'local',
      mimeType: (payload.mimeType || '').trim(),
      size: Number(payload.size) >= 0 ? Number(payload.size) : 0,
      description: (payload.description || '').trim(),
      tags: Array.isArray(payload.tags) ? payload.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      fileHash: normalizeMd5(payload.fileHash) || ''
    });
    return doc.toJSON();
  }

  async update(id, payload) {
    const doc = await Material.findById(id);
    if (!doc) return null;
    if (payload.name !== undefined) doc.name = String(payload.name).trim();
    if (payload.description !== undefined) doc.description = String(payload.description).trim();
    if (payload.tags !== undefined) {
      doc.tags = Array.isArray(payload.tags) ? payload.tags.map((t) => String(t).trim()).filter(Boolean) : [];
    }
    if (payload.groupId !== undefined) {
      doc.groupId = resolveGroupIdForCreate(payload.groupId);
    }
    await doc.save();
    return doc.toJSON();
  }

  async bulkDelete(ids, uploadCfg, rootDir) {
    const validIds = [...new Set((ids || []).map(String).filter((i) => mongoose.isValidObjectId(i)))];
    let deleted = 0;
    const blocked = [];
    for (const id of validIds) {
      try {
        if (await this.delete(id, uploadCfg, rootDir)) deleted += 1;
      } catch (err) {
        if (err.code !== 'MATERIAL_IN_USE') throw err;
        blocked.push({
          id,
          usageCount: err.usageCount || 0,
          usageRefs: err.usageRefs || [],
          message: err.message
        });
      }
    }
    return { deleted, blocked };
  }

  async bulkSetGroup(ids, groupIdRaw) {
    const validIds = [...new Set((ids || []).map(String).filter((i) => mongoose.isValidObjectId(i)))];
    if (!validIds.length) return 0;
    let gid = null;
    if (groupIdRaw != null && String(groupIdRaw).trim() !== '') {
      if (!mongoose.isValidObjectId(String(groupIdRaw))) {
        const err = new Error('无效的分组 id');
        err.status = 400;
        throw err;
      }
      gid = new mongoose.Types.ObjectId(String(groupIdRaw));
    }
    const res = await Material.updateMany({ _id: { $in: validIds } }, { $set: { groupId: gid } });
    return res.modifiedCount;
  }

  async delete(id, uploadCfg, rootDir) {
    const doc = await Material.findById(id);
    if (!doc) return false;
    await this.assertMaterialNotInUse(doc);
    const url = doc.url;
    const driver = doc.storageDriver || 'local';
    await Material.findByIdAndDelete(id);
    if (rootDir) {
      const remaining = await Material.countDocuments({ url });
      if (remaining === 0) await storageService.removeStoredFile(url, rootDir, { driver }).catch(() => {});
    }
    return true;
  }
}

module.exports = new MaterialService();
