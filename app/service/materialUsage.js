/**
 * 素材引用检查服务。
 *
 * 脚手架本身不预设业务表，但业务模块通常会把素材 URL 写入图片、封面、附件等字段。
 * 这里提供统一的注册与查询入口，后续模块只需要注册引用来源，素材管理即可获得“使用中”
 * 状态，并在删除/替换文件前做后端兜底保护。
 */
const usageSources = [];

function normalizeMaterialUrl(url) {
  return String(url || '').trim();
}

function normalizeUsageRef(ref = {}) {
  return {
    type: String(ref.type || 'business'),
    label: String(ref.label || '业务引用'),
    title: String(ref.title || '未命名'),
    status: String(ref.status || '')
  };
}

/**
 * 注册一个素材引用来源。
 *
 * @param {Object} source 引用来源配置。
 * @param {string} source.name 来源名称，用于排查异常来源。
 * @param {(urls: string[], pushUsage: Function) => Promise<void>|void} source.findUsages
 * 查询指定素材 URL 的使用位置；命中后调用 pushUsage(url, ref) 写入引用说明。
 * @returns {Function} 取消注册方法，便于测试或插件卸载。
 */
function registerMaterialUsageSource(source = {}) {
  if (!source || typeof source.findUsages !== 'function') {
    throw new Error('素材引用来源必须提供 findUsages(urls, pushUsage) 方法');
  }
  const item = {
    name: String(source.name || `source_${usageSources.length + 1}`),
    findUsages: source.findUsages
  };
  usageSources.push(item);
  return () => {
    const index = usageSources.indexOf(item);
    if (index >= 0) usageSources.splice(index, 1);
  };
}

/**
 * 构建素材 URL 到引用位置的映射。
 *
 * @param {string[]} urls 需要检查的素材访问地址列表。
 * @returns {Promise<Map<string, Array>>} url -> 使用位置数组。
 */
async function buildMaterialUsageMap(urls = []) {
  const uniqUrls = [...new Set((urls || []).map(normalizeMaterialUrl).filter(Boolean))];
  const usageMap = new Map(uniqUrls.map((url) => [url, []]));
  if (!uniqUrls.length || !usageSources.length) return usageMap;

  const pushUsage = (url, ref) => {
    const key = normalizeMaterialUrl(url);
    if (!key || !usageMap.has(key)) return;
    usageMap.get(key).push(normalizeUsageRef(ref));
  };

  for (const source of usageSources) {
    try {
      await source.findUsages(uniqUrls, pushUsage);
    } catch (err) {
      // 引用检查是删除保护链路的一部分，来源异常必须暴露出来，避免误删仍被业务使用的素材。
      err.message = `素材引用来源 ${source.name} 检查失败：${err.message || err}`;
      throw err;
    }
  }

  return usageMap;
}

module.exports = {
  buildMaterialUsageMap,
  normalizeMaterialUrl,
  registerMaterialUsageSource
};
