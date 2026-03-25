const path = require('path');
const fs = require('fs/promises');
const { mongoose } = require('../model/db');
const Material = require('../model/material');
const { md5FileHex, normalizeMd5 } = require('../lib/fileMd5');
const {
  classifyMaterialType,
  makeStoredFilename,
  ensureDir,
  moveFile,
  removeStoredFileIfManaged,
  publicUrlForFile,
  uploadAbsDir
} = require('../lib/materialUpload');

function resolveGroupIdForCreate(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!s || !mongoose.isValidObjectId(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

class MaterialService {
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
    return { list: items.map((d) => d.toJSON()), total };
  }

  async getById(id) {
    const doc = await Material.findById(id);
    return doc ? doc.toJSON() : null;
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
      thumbnail: src.thumbnail || ''
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
    const oldUrl = doc.url;
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
    doc.fileHash = h;
    await doc.save();
    const leftOld = await Material.countDocuments({ url: oldUrl });
    if (leftOld === 0 && uploadCfg && rootDir) {
      await removeStoredFileIfManaged(oldUrl, rootDir, uploadCfg.publicPath, uploadCfg.dir);
    }
    return doc.toJSON();
  }

  async persistUploadedFile({ tempPath, originalFilename, mimetype, size }, uploadCfg, rootDir) {
    const absDir = uploadAbsDir(rootDir, uploadCfg.dir);
    await ensureDir(absDir);
    const type = classifyMaterialType(mimetype, originalFilename);
    const storedName = makeStoredFilename(originalFilename, mimetype);
    const dest = path.join(absDir, storedName);
    await moveFile(tempPath, dest);
    const url = publicUrlForFile(uploadCfg.publicPath, storedName);
    const sz = Number(size) >= 0 ? Number(size) : 0;
    return {
      url,
      type,
      mimeType: (mimetype || '').trim(),
      size: sz,
      thumbnail: type === 'image' ? url : '',
      _localPath: dest
    };
  }

  async applyDedupeByHash(persisted, destPath) {
    const fileHash = await md5FileHex(destPath);
    const dup = await Material.findOne({ fileHash, size: persisted.size }).lean();
    if (dup && dup.url && dup.url !== persisted.url) {
      await fs.unlink(destPath).catch(() => {});
      return {
        url: dup.url,
        type: dup.type,
        mimeType: dup.mimeType || '',
        size: dup.size,
        thumbnail: dup.thumbnail || '',
        fileHash,
        _ownsBlob: false
      };
    }
    return {
      url: persisted.url,
      type: persisted.type,
      mimeType: persisted.mimeType,
      size: persisted.size,
      thumbnail: persisted.thumbnail,
      fileHash,
      _ownsBlob: true
    };
  }

  async createFromUpload({ fileMeta, name, description, tags, groupId }, uploadCfg, rootDir) {
    let persisted;
    let destPath;
    let withHash;
    try {
      persisted = await this.persistUploadedFile(fileMeta, uploadCfg, rootDir);
      destPath = persisted._localPath;
      delete persisted._localPath;

      withHash = await this.applyDedupeByHash(persisted, destPath);
      const rest = { ...withHash };
      delete rest._ownsBlob;
      const base =
        (name || '').trim() ||
        path.parse(String(fileMeta.originalFilename || '').trim() || 'file').name ||
        '未命名素材';
      return await this.create({
        name: base,
        ...rest,
        description: (description || '').trim(),
        tags: Array.isArray(tags) ? tags : [],
        groupId: resolveGroupIdForCreate(groupId)
      });
    } catch (e) {
      if (withHash && withHash._ownsBlob && withHash.url) {
        await removeStoredFileIfManaged(withHash.url, rootDir, uploadCfg.publicPath, uploadCfg.dir).catch(() => {});
      } else if (destPath) {
        await fs.unlink(destPath).catch(() => {});
      }
      throw e;
    }
  }

  async replaceWithUpload(id, { fileMeta, name, description, tags, groupId }, uploadCfg, rootDir) {
    const doc = await Material.findById(id);
    if (!doc) return null;
    let persisted;
    const oldUrl = doc.url;
    let destPath;
    let withHash;
    try {
      persisted = await this.persistUploadedFile(fileMeta, uploadCfg, rootDir);
      destPath = persisted._localPath;
      delete persisted._localPath;

      withHash = await this.applyDedupeByHash(persisted, destPath);
      const rest = { ...withHash };
      delete rest._ownsBlob;
      if (name !== undefined && String(name).trim()) doc.name = String(name).trim();
      if (description !== undefined) doc.description = String(description).trim();
      if (tags !== undefined) {
        doc.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
      }
      Object.assign(doc, rest);
      if (groupId !== undefined) doc.groupId = resolveGroupIdForCreate(groupId);
      await doc.save();

      const leftOld = await Material.countDocuments({ url: oldUrl });
      if (leftOld === 0) await removeStoredFileIfManaged(oldUrl, rootDir, uploadCfg.publicPath, uploadCfg.dir);

      return doc.toJSON();
    } catch (e) {
      if (withHash && withHash._ownsBlob && withHash.url) {
        await removeStoredFileIfManaged(withHash.url, rootDir, uploadCfg.publicPath, uploadCfg.dir).catch(() => {});
      } else if (destPath) await fs.unlink(destPath).catch(() => {});
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
    let n = 0;
    for (const id of validIds) {
      if (await this.delete(id, uploadCfg, rootDir)) n += 1;
    }
    return n;
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
    const url = doc.url;
    await Material.findByIdAndDelete(id);
    if (uploadCfg && rootDir) {
      const remaining = await Material.countDocuments({ url });
      if (remaining === 0) await removeStoredFileIfManaged(url, rootDir, uploadCfg.publicPath, uploadCfg.dir);
    }
    return true;
  }
}

module.exports = new MaterialService();
