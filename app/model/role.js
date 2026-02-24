/**
 * 角色数据模型 - 仅定义数据类型与输出格式
 */
const { mongoose } = require('./db');

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    permissionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

RoleSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
module.exports = Role;
