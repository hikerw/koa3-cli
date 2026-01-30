/**
 * 用户数据模型 - MongoDB (Mongoose)
 */
const { mongoose } = require('./db');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' }
  },
  { timestamps: true }
);



UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

class UserModel {
  /**
   * 查找所有用户（支持分页）
   */
  async findAll({ page = 1, pageSize = 10 } = {}) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      User.countDocuments()
    ]);

    return { items: items.map((doc) => doc.toJSON()), total };
  }

  /**
   * 根据ID查找用户
   */
  async findById(id) {
    const user = await User.findById(id);
    return user ? user.toJSON() : null;
  }

  /**
   * 创建用户
   */
  async create(userData) {
    const user = await User.create(userData);
    return user.toJSON();
  }

  /**
   * 更新用户
   */
  async update(id, userData) {
    const user = await User.findByIdAndUpdate(id, userData, { new: true, runValidators: true });
    return user ? user.toJSON() : null;
  }

  /**
   * 删除用户
   */
  async delete(id) {
    const res = await User.findByIdAndDelete(id);
    return !!res;
  }
}

module.exports = new UserModel();


