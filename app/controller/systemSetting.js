const systemSettingService = require('../service/systemSetting');
const logService = require('../service/log');
const { ok } = require('../lib/response');

class SystemSettingController {
  /** 获取文件存储配置，供后管配置页回显当前上传落点。 */
  async getStorage(ctx) {
    ok(ctx, await systemSettingService.getStorageSetting());
  }

  /** 保存文件存储配置，后台可在本地存储和七牛云之间切换。 */
  async saveStorage(ctx) {
    const setting = await systemSettingService.saveStorageSetting(ctx.request.body || {});
    await logService.create(ctx, {
      action: 'update',
      module: 'system-storage',
      operatorId: ctx.state.user?.id,
      operatorName: ctx.state.user?.username,
      detail: `更新存储配置：${setting.driver === 'qiniu' ? '七牛云' : '本地存储'}`
    });
    ok(ctx, setting);
  }
}

module.exports = new SystemSettingController();
