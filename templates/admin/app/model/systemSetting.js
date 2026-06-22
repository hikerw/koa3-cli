/**
 * 系统配置模型。
 *
 * 使用 key/value 保存后管可配置项，当前用于文件存储驱动配置；后续短信、支付、对象存储等
 * 项目级配置也可以复用这个表，避免为每类配置新增一张小表。
 */
const { mongoose } = require('./db');

const SystemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Object, default: {} }
  },
  { timestamps: true }
);

SystemSettingSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const SystemSetting = mongoose.models.SystemSetting || mongoose.model('SystemSetting', SystemSettingSchema);
module.exports = SystemSetting;
