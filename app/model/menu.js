/**
 * 菜单数据模型 - 仅定义数据类型与输出格式
 */
const { mongoose } = require('./db');

const MenuSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    path: { type: String, default: '', trim: true },
    icon: { type: String, default: '', trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', default: null },
    order: { type: Number, default: 0 },
    permissionCode: { type: String, default: '' }
  },
  { timestamps: true }
);

MenuSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.parentId) ret.parentId = ret.parentId.toString();
    else ret.parentId = null;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
module.exports = Menu;
