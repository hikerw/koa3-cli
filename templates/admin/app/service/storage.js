const path = require('path');
const fs = require('fs/promises');
const qiniu = require('qiniu');
const { loadConfig } = require('../../config/loader');
const systemSettingService = require('./systemSetting');
const {
  classifyMaterialType,
  makeStoredFilename,
  ensureDir,
  moveFile,
  removeStoredFileIfManaged,
  publicUrlForFile,
  uploadAbsDir
} = require('../lib/materialUpload');

function normalizeDomain(domain = '') {
  const value = String(domain || '').trim().replace(/\/+$/, '');
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function normalizePrefix(prefix = '') {
  return String(prefix || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
}

function qiniuZone(region = 'z0') {
  const key = String(region || 'z0').trim();
  // 七牛 Node.js SDK 的区域常量是 Zone_z0 / Zone_z1 等；后台只保存短区域码，方便运维填写。
  const zoneMap = {
    z0: qiniu.zone.Zone_z0,
    cn_east_2: qiniu.zone.Zone_cn_east_2,
    z1: qiniu.zone.Zone_z1,
    z2: qiniu.zone.Zone_z2,
    na0: qiniu.zone.Zone_na0,
    as0: qiniu.zone.Zone_as0
  };
  return zoneMap[key] || qiniu.zone[key] || qiniu.zone.Zone_z0;
}

function buildQiniuKey(prefix, storedName) {
  const p = normalizePrefix(prefix);
  return p ? `${p}/${storedName}` : storedName;
}

function qiniuUrl(domain, key) {
  return `${normalizeDomain(domain)}/${key}`;
}

function qiniuKeyFromUrl(url = '', cfg = {}) {
  const domain = normalizeDomain(cfg.domain);
  const value = String(url || '').split('?')[0];
  if (!domain || !value.startsWith(domain)) return '';
  return decodeURIComponent(value.slice(domain.length).replace(/^\/+/, ''));
}

async function uploadToQiniu(filePath, key, cfg = {}) {
  const mac = new qiniu.auth.digest.Mac(cfg.accessKey, cfg.secretKey);
  const putPolicy = new qiniu.rs.PutPolicy({ scope: `${cfg.bucket}:${key}` });
  const uploadToken = putPolicy.uploadToken(mac);
  const config = new qiniu.conf.Config();
  config.zone = qiniuZone(cfg.region);
  const formUploader = new qiniu.form_up.FormUploader(config);
  const putExtra = new qiniu.form_up.PutExtra();

  return new Promise((resolve, reject) => {
    formUploader.putFile(uploadToken, key, filePath, putExtra, (err, body, info) => {
      if (err) {
        reject(err);
        return;
      }
      if (info?.statusCode >= 200 && info?.statusCode < 300) {
        resolve(body);
        return;
      }
      reject(new Error(body?.error || `七牛上传失败：${info?.statusCode || 'unknown'}`));
    });
  });
}

async function deleteFromQiniu(key, cfg = {}) {
  if (!key || !cfg.accessKey || !cfg.secretKey || !cfg.bucket) return;
  const mac = new qiniu.auth.digest.Mac(cfg.accessKey, cfg.secretKey);
  const config = new qiniu.conf.Config();
  config.zone = qiniuZone(cfg.region);
  const bucketManager = new qiniu.rs.BucketManager(mac, config);
  await new Promise((resolve) => {
    // 删除远端历史文件失败不阻断本地素材记录删除，避免配置变更后后台无法清理数据。
    bucketManager.delete(cfg.bucket, key, () => resolve());
  });
}

class StorageService {
  /** 汇总代码配置和后台配置，得到当前上传链路使用的存储配置。 */
  async getUploadConfig() {
    const config = loadConfig();
    const upload = config.upload || {};
    const setting = await systemSettingService.getStorageSetting();
    return {
      maxFileSize: upload.maxFileSize || 200 * 1024 * 1024,
      driver: setting.driver,
      local: {
        dir: setting.local?.dir || upload.dir || 'public/uploads/materials',
        publicPath: setting.local?.publicPath || upload.publicPath || '/uploads/materials'
      },
      qiniu: setting.qiniu || {}
    };
  }

  /** 保存上传文件；七牛云密钥只在服务端使用，前端永远不直接拿上传 token。 */
  async saveUploadedFile({ tempPath, originalFilename, mimetype, size }, rootDir) {
    const cfg = await this.getUploadConfig();
    const type = classifyMaterialType(mimetype, originalFilename);
    const storedName = makeStoredFilename(originalFilename, mimetype);
    const sz = Number(size) >= 0 ? Number(size) : 0;

    if (cfg.driver === 'qiniu') {
      const q = cfg.qiniu || {};
      const key = buildQiniuKey(q.prefix, storedName);
      await uploadToQiniu(tempPath, key, q);
      await fs.unlink(tempPath).catch(() => {});
      const url = qiniuUrl(q.domain, key);
      return {
        url,
        type,
        mimeType: (mimetype || '').trim(),
        size: sz,
        thumbnail: type === 'image' ? url : '',
        storageDriver: 'qiniu'
      };
    }

    const absDir = uploadAbsDir(rootDir, cfg.local.dir);
    await ensureDir(absDir);
    const dest = path.join(absDir, storedName);
    await moveFile(tempPath, dest);
    const url = publicUrlForFile(cfg.local.publicPath, storedName);
    return {
      url,
      type,
      mimeType: (mimetype || '').trim(),
      size: sz,
      thumbnail: type === 'image' ? url : '',
      storageDriver: 'local',
      _localPath: dest
    };
  }

  /** 删除当前项目托管的文件；根据素材记录中的历史驱动删除，避免切换存储后找错位置。 */
  async removeStoredFile(url, rootDir, options = null) {
    const currentCfg = await this.getUploadConfig();
    const uploadCfg = {
      ...currentCfg,
      ...(options && typeof options === 'object' ? options : {})
    };
    const driver = uploadCfg.driver === 'qiniu' ? 'qiniu' : 'local';
    if (driver === 'qiniu') {
      const key = qiniuKeyFromUrl(url, uploadCfg.qiniu || {});
      await deleteFromQiniu(key, uploadCfg.qiniu || {});
      return;
    }
    await removeStoredFileIfManaged(url, rootDir, uploadCfg.local?.publicPath, uploadCfg.local?.dir);
  }
}

module.exports = new StorageService();
