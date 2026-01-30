/**
 * 用户服务层
 * 处理业务逻辑，与数据模型交互
 */
const userModel = require('../model/user');

class UserService {
  /**
   * 获取用户列表（分页）
   */
  async getUserList({ page = 1, pageSize = 10 } = {}) {
    const { items, total } = await userModel.findAll({ page, pageSize });
    return {
      list: items,
      total,
      page,
      pageSize
    };
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id) {
    return await userModel.findById(id);
  }

  /**
   * 创建用户
   */
  async createUser(userData) {
    try {
      return await userModel.create(userData);
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
      return await userModel.update(id, userData);
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
    return await userModel.delete(id);
  }
}

module.exports = new UserService();

