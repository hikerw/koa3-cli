/**
 * 用户服务层
 * 处理业务逻辑与数据访问（示例为内存存储，实际可替换为数据库）
 */
// 示例：内存存储（实际项目中应连接数据库）
let users = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', createdAt: new Date() },
  { id: 2, name: '李四', email: 'lisi@example.com', createdAt: new Date() }
];

class UserService {
  async getUserList() {
    return users;
  }

  async getUserById(id) {
    return users.find(user => user.id === parseInt(id, 10));
  }

  async createUser(userData) {
    if (!userData.name || !userData.email) {
      throw new Error('Name and email are required');
    }
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      ...userData,
      createdAt: new Date()
    };
    users.push(newUser);
    return newUser;
  }

  async updateUser(id, userData) {
    const index = users.findIndex(user => user.id === parseInt(id, 10));
    if (index === -1) return null;
    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: new Date()
    };
    return users[index];
  }

  async deleteUser(id) {
    const index = users.findIndex(user => user.id === parseInt(id, 10));
    if (index === -1) return false;
    users.splice(index, 1);
    return true;
  }
}

module.exports = new UserService();
