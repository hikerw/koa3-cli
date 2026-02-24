/**
 * 权限数据模型 - 仅定义数据类型与输出格式
 */
const { mongoose } = require('./db');

const PermissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    type: { type: String, enum: ['menu', 'button', 'api'], default: 'api' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Permission', default: null },
    description: { type: String, default: '' },
    menuIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Menu' }]
  },
  { timestamps: true }
);

PermissionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.parentId) ret.parentId = ret.parentId.toString();
    else ret.parentId = null;
    if (ret.menuIds && ret.menuIds.length)
      ret.menuIds = ret.menuIds.map((id) => (id && id.toString ? id.toString() : id));
    else ret.menuIds = [];
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);
module.exports = Permission;
