/**
 * 用户服务层
 * 处理业务逻辑，与数据模型交互
 */
const userModel = require('../model/user');

class UserService {
  /**
   * 获取用户列表
   */
  async getUserList() {
    // 这里应该从数据库获取数据
    // 示例：返回模拟数据
    return await userModel.findAll();
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
    // 数据验证
    if (!userData.name || !userData.email) {
      throw new Error('Name and email are required');
    }
    return await userModel.create(userData);
  }

  /**
   * 更新用户
   */
  async updateUser(id, userData) {
    return await userModel.update(id, userData);
  }

  /**
   * 删除用户
   */
  async deleteUser(id) {
    return await userModel.delete(id);
  }
}

module.exports = new UserService();
