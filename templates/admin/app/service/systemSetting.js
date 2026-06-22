const SystemSetting = require('../model/systemSetting');

const STORAGE_SETTING_KEY = 'storage';

const defaultStorageSetting = {
  driver: 'local',
  local: {
    dir: 'public/uploads/materials',
    publicPath: '/uploads/materials'
  },
  qiniu: {
    accessKey: '',
    secretKey: '',
    bucket: '',
    domain: '',
    region: 'z0',
    prefix: 'materials'
  }
};

function mergeStorageSetting(value = {}) {
  const local = { ...defaultStorageSetting.local, ...(value.local || {}) };
  const qiniu = { ...defaultStorageSetting.qiniu, ...(value.qiniu || {}) };
  return {
    driver: value.driver === 'qiniu' ? 'qiniu' : 'local',
    local: {
      dir: String(local.dir || defaultStorageSetting.local.dir).trim(),
      publicPath: String(local.publicPath || defaultStorageSetting.local.publicPath).trim()
    },
    qiniu: {
      accessKey: String(qiniu.accessKey || '').trim(),
      secretKey: String(qiniu.secretKey || '').trim(),
      bucket: String(qiniu.bucket || '').trim(),
      domain: String(qiniu.domain || '').trim(),
      region: String(qiniu.region || defaultStorageSetting.qiniu.region).trim(),
      prefix: String(qiniu.prefix || '').trim()
    }
  };
}

class SystemSettingService {
  /** 获取文件存储配置；没有保存过配置时返回本地存储默认值。 */
  async getStorageSetting() {
    const doc = await SystemSetting.findOne({ key: STORAGE_SETTING_KEY }).lean();
    return mergeStorageSetting(doc?.value || {});
  }

  /** 保存文件存储配置；七牛云启用时必须校验核心密钥和空间信息，避免上传时才失败。 */
  async saveStorageSetting(payload = {}) {
    const next = mergeStorageSetting(payload);
    if (next.driver === 'qiniu') {
      const q = next.qiniu;
      if (!q.accessKey || !q.secretKey || !q.bucket || !q.domain) {
        const err = new Error('启用七牛云时，请完整填写 AccessKey、SecretKey、空间名称和访问域名');
        err.status = 400;
        throw err;
      }
    }
    const doc = await SystemSetting.findOneAndUpdate(
      { key: STORAGE_SETTING_KEY },
      { $set: { value: next } },
      { new: true, upsert: true }
    );
    return mergeStorageSetting(doc.value || {});
  }
}

module.exports = new SystemSettingService();
