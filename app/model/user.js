/**
 * 用户数据格式定义
 * 仅描述数据结构，不包含数据访问方法
 */

/** @typedef {Object} User
 * @property {number} id - 用户ID
 * @property {string} name - 用户名
 * @property {string} email - 邮箱
 * @property {Date} [createdAt] - 创建时间
 * @property {Date} [updatedAt] - 更新时间
 */

/**
 * 用户数据格式（用于校验、文档与默认值）
 */
const userSchema = {
  id: null,
  name: '',
  email: '',
  createdAt: null,
  updatedAt: null
};

module.exports = {
  userSchema
};
