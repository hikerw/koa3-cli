/**
 * 操作日志数据模型 - 仅定义数据类型与输出格式
 */
const { mongoose } = require('./db');

const LogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // login_success, login_fail, create, update, delete
    module: { type: String, required: true }, // auth, system_user, role, permission, menu
    operatorId: { type: String, default: null },
    operatorName: { type: String, default: '' },
    targetId: { type: String, default: null },
    detail: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' }
  },
  { timestamps: true }
);

LogSchema.index({ createdAt: -1 });
LogSchema.index({ module: 1, action: 1 });
LogSchema.index({ operatorId: 1 });

LogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);
module.exports = Log;
