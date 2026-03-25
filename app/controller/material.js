const path = require('path');
const fs = require('fs/promises');
const { formidable } = require('formidable');
const { loadConfig } = require('../../config/loader');
const materialService = require('../service/material');
const { ensureDir } = require('../lib/materialUpload');
const logService = require('../service/log');

const rootDir = path.join(__dirname, '../..');

function defaultUploadCfg() {
  return {
    dir: 'public/uploads/materials',
    publicPath: '/uploads/materials',
    maxFileSize: 200 * 1024 * 1024
  };
}

function mergedUploadCfg() {
  const config = loadConfig();
  return Object.assign(defaultUploadCfg(), config.upload || {});
}

function parseTagsField(fields) {
  const raw = fields.tags?.[0];
  if (raw == null || raw === '') return [];
  const s = String(raw).trim();
  try {
    const j = JSON.parse(s);
    if (Array.isArray(j)) return j.map((x) => String(x).trim()).filter(Boolean);
  } catch (_) {}
  return s.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
}

class MaterialController {
  /** POST { md520 | fileHash, size } */
  async checkHash(ctx) {
    const body = ctx.request.body || {};
    const md = body.md5 || body.fileHash;
    const size = body.size;
    const result = await materialService.checkContentHit(md, size);
    ctx.body = result;
  }

  /**
   * POST JSON：md5/fileHash + size 必填；materialId 有值为替换该条为已有.blob
   * name / description / tags 可选
   */
  async instant(ctx) {
    const body = ctx.request.body || {};
    const fileHash = body.md5 || body.fileHash;
    const size = body.size;
    const tags = Array.isArray(body.tags) ? body.tags : [];
    const uploadCfg = mergedUploadCfg();
    const mid = body.materialId != null ? String(body.materialId).trim() : '';

    try {
      let row;
      if (mid) {
        row = await materialService.replaceFromInstant(
          mid,
          {
            fileHash,
            size,
            name: body.name,
            description: body.description,
            tags,
            groupId: body.groupId
          },
          uploadCfg,
          rootDir
        );
        if (!row) {
          ctx.status = 404;
          ctx.body = { message: 'Not found' };
          return;
        }
        await logService.create(ctx, {
          action: 'update',
          module: 'material',
          operatorId: ctx.state.user?.id,
          operatorName: ctx.state.user?.username,
          targetId: row.id,
          detail: `秒传替换文件: ${row.name || ''}`
        });
        ctx.body = row;
        return;
      }

      row = await materialService.createFromInstant({
        fileHash,
        size,
        name: body.name,
        description: body.description,
        tags,
        groupId: body.groupId
      });
      await logService.create(ctx, {
        action: 'create',
        module: 'material',
        operatorId: ctx.state.user?.id,
        operatorName: ctx.state.user?.username,
        targetId: row?.id,
        detail: `秒传新增素材: ${row?.name || ''}`
      });
      ctx.status = 201;
      ctx.body = row;
    } catch (e) {
      if (e.status) {
        ctx.status = e.status;
        ctx.body = { message: e.message };
        return;
      }
      ctx.throw(500, e.message);
    }
  }

  async list(ctx) {
    const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(ctx.query.pageSize, 10) || 50));
    const name = ctx.query.name || '';
    const keyword = ctx.query.keyword || '';
    const url = ctx.query.url || '';
    const typeTab = ctx.query.typeTab || ctx.query.type || '';
    const group = ctx.query.group || 'all';
    const result = await materialService.getList({
      page,
      pageSize,
      name,
      keyword,
      url,
      typeTab,
      group
    });
    ctx.body = result;
  }

  async bulkDelete(ctx) {
    const body = ctx.request.body || {};
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const uploadCfg = mergedUploadCfg();
    const n = await materialService.bulkDelete(ids, uploadCfg, rootDir);
    await logService.create(ctx, {
      action: 'delete',
      module: 'material',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      detail: `批量删除素材 ${n} 条`
    });
    ctx.body = { deleted: n };
  }

  async bulkGroup(ctx) {
    const body = ctx.request.body || {};
    const ids = Array.isArray(body.ids) ? body.ids : [];
    try {
      const n = await materialService.bulkSetGroup(ids, body.groupId);
      await logService.create(ctx, {
        action: 'update',
        module: 'material',
        operatorId: ctx.state.user?.id,
        operatorName: ctx.state.user?.username,
        detail: `批量移动素材到分组 ${n} 条`
      });
      ctx.body = { updated: n };
    } catch (e) {
      ctx.status = e.status || 400;
      ctx.body = { message: e.message };
    }
  }

  async detail(ctx) {
    const row = await materialService.getById(ctx.params.id);
    if (!row) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    ctx.body = row;
  }

  /**
   * multipart：file 必填；name、description、tags（JSON 数组或逗号分隔）；materialId 有值则替换该条素材文件
   */
  async upload(ctx) {
    const uploadCfg = mergedUploadCfg();
    const absDir = path.join(rootDir, uploadCfg.dir);
    await ensureDir(absDir);

    const form = formidable({
      uploadDir: absDir,
      maxFileSize: uploadCfg.maxFileSize,
      keepExtensions: true,
      maxFiles: 1,
      maxFields: 20
    });

    let fields;
    let files;
    try {
      [fields, files] = await form.parse(ctx.req);
    } catch (e) {
      const msg = String(e.message || '');
      const message =
        e.httpCode === 413 || /maxFileSize|greater than|exceeded/i.test(msg) ? '文件超出大小限制' : msg || '上传解析失败';
      ctx.status = 400;
      ctx.body = { message };
      return;
    }

    const fileArr = files.file;
    const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;
    if (!file || !file.filepath) {
      ctx.status = 400;
      ctx.body = { message: '请选择要上传的文件' };
      return;
    }

    const rawMid = fields.materialId?.[0] ?? fields.materialId;
    const materialId = rawMid != null ? String(rawMid).trim() : '';
    const name = fields.name?.[0] ?? '';
    const description = fields.description?.[0] ?? '';
    const tags = parseTagsField(fields);
    const rawGid = fields.groupId?.[0] ?? fields.groupId;
    const groupId = rawGid != null && String(rawGid).trim() !== '' ? String(rawGid).trim() : null;

    const fileMeta = {
      tempPath: file.filepath,
      originalFilename: file.originalFilename || '',
      mimetype: file.mimetype || '',
      size: file.size
    };

    try {
      if (materialId) {
        const row = await materialService.replaceWithUpload(
          materialId,
          { fileMeta, name, description, tags, groupId },
          uploadCfg,
          rootDir
        );
        if (!row) {
          await fs.unlink(fileMeta.tempPath).catch(() => {});
          ctx.status = 404;
          ctx.body = { message: 'Not found' };
          return;
        }
        await logService.create(ctx, {
          action: 'update',
          module: 'material',
          operatorId: ctx.state.user?.id,
          operatorName: ctx.state.user?.username,
          targetId: row.id,
          detail: `替换素材文件: ${row.name || ''}`
        });
        ctx.body = row;
        return;
      }

      const row = await materialService.createFromUpload(
        { fileMeta, name, description, tags, groupId },
        uploadCfg,
        rootDir
      );
      await logService.create(ctx, {
        action: 'create',
        module: 'material',
        operatorId: ctx.state.user?.id,
        operatorName: ctx.state.user?.username,
        targetId: row?.id,
        detail: `新增素材: ${row?.name || ''}`
      });
      ctx.status = 201;
      ctx.body = row;
    } catch (e) {
      ctx.throw(500, e.message);
    }
  }

  /** JSON 创建（保留兼容：需自带可访问 url） */
  async create(ctx) {
    const body = ctx.request.body || {};
    if (!body.name || !String(body.name).trim()) {
      ctx.status = 400;
      ctx.body = { message: '素材名称不能为空' };
      return;
    }
    if (!body.url || !String(body.url).trim()) {
      ctx.status = 400;
      ctx.body = { message: '请上传文件或使用资源地址创建' };
      return;
    }
    const row = await materialService.create(body);
    await logService.create(ctx, {
      action: 'create',
      module: 'material',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: row?.id,
      detail: `新增素材: ${row?.name || ''}`
    });
    ctx.status = 201;
    ctx.body = row;
  }

  async update(ctx) {
    const row = await materialService.update(ctx.params.id, ctx.request.body || {});
    if (!row) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    await logService.create(ctx, {
      action: 'update',
      module: 'material',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: row.id,
      detail: `更新素材: ${row.name || ''}`
    });
    ctx.body = row;
  }

  async delete(ctx) {
    const uploadCfg = mergedUploadCfg();
    const id = ctx.params.id;
    const before = await materialService.getById(id);
    const ok = await materialService.delete(id, uploadCfg, rootDir);
    if (!ok) {
      ctx.status = 404;
      ctx.body = { message: 'Not found' };
      return;
    }
    await logService.create(ctx, {
      action: 'delete',
      module: 'material',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      targetId: id,
      detail: before ? `删除素材: ${before.name}` : `删除素材 id: ${id}`
    });
    ctx.body = { message: 'Deleted' };
  }
}

module.exports = new MaterialController();
