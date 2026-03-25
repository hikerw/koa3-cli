/**
 * 操作日志数据模型 - 仅定义数据类型与输出格式
 */
const { mongoose } = require('./db');

const LogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, comment: '动作类型，如 login_success、create、update、delete' },
    module: { type: String, required: true, comment: '业务模块，如 auth、system_user、role、menu' },
    operatorId: { type: String, default: null, comment: '操作者 ID（未登录可能为空）' },
    operatorName: { type: String, default: '', comment: '操作者名称' },
    targetId: { type: String, default: null, comment: '操作目标 ID（可选）' },
    detail: { type: String, default: '', comment: '操作详情描述' },
    ip: { type: String, default: '', comment: '请求来源 IP' },
    userAgent: { type: String, default: '', comment: '客户端 User-Agent' }
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
