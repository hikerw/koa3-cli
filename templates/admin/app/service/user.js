/**
 * 用户服务层
 * 处理业务逻辑，与数据模型交互
 */
const User = require('../model/user');

class UserService {
  /**
   * 获取用户列表（分页）
   */
  async getUserList({ page = 1, pageSize = 10 } = {}) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      User.countDocuments()
    ]);
    return {
      list: items.map((doc) => doc.toJSON()),
      total,
      page,
      pageSize
    };
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id) {
    const user = await User.findById(id);
    return user ? user.toJSON() : null;
  }

  /**
   * 创建用户
   */
  async createUser(userData) {
    try {
      const user = await User.create(userData);
      return user.toJSON();
    } catch (err) {
      if (err && err.code === 11000) {
        const error = new Error('email 已存在');
        error.status = 400;
        throw error;
      }
      throw err;
    }
  }

  /**
   * 更新用户
   */
  async updateUser(id, userData) {
    try {
      const user = await User.findByIdAndUpdate(id, userData, {
        new: true,
        runValidators: true
      });
      return user ? user.toJSON() : null;
    } catch (err) {
      if (err && err.code === 11000) {
        const error = new Error('email 已存在');
        error.status = 400;
        throw error;
      }
      throw err;
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(id) {
    const res = await User.findByIdAndDelete(id);
    return !!res;
  }
}

module.exports = new UserService();
