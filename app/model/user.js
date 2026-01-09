/**
 * 用户数据模型
 * 负责与数据库交互
 */

// 示例：模拟数据存储（实际项目中应该连接真实数据库）
let users = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', createdAt: new Date() },
  { id: 2, name: '李四', email: 'lisi@example.com', createdAt: new Date() }
];

class UserModel {
  /**
   * 查找所有用户
   */
  async findAll() {
    // 实际项目中应该查询数据库
    return users;
  }

  /**
   * 根据ID查找用户
   */
  async findById(id) {
    return users.find(user => user.id === parseInt(id));
  }

  /**
   * 创建用户
   */
  async create(userData) {
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      ...userData,
      createdAt: new Date()
    };
    users.push(newUser);
    return newUser;
  }

  /**
   * 更新用户
   */
  async update(id, userData) {
    const index = users.findIndex(user => user.id === parseInt(id));
    if (index === -1) {
      return null;
    }
    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: new Date()
    };
    return users[index];
  }

  /**
   * 删除用户
   */
  async delete(id) {
    const index = users.findIndex(user => user.id === parseInt(id));
    if (index === -1) {
      return false;
    }
    users.splice(index, 1);
    return true;
  }
}

module.exports = new UserModel();
