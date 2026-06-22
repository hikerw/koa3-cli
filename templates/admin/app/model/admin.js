/**
 * 管理员数据模型 - 仅定义数据类型与输出格式
 */
const { mongoose } = require('./db');

const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    isSuperAdmin: { type: Boolean, default: false }
  },
  { timestamps: true }
);

AdminSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.roleIds && ret.roleIds.length) ret.roleIds = ret.roleIds.map((r) => r.toString?.() || r);
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

module.exports = Admin;
