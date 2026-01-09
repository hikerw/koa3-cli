/**
 * 本地开发环境配置
 * 只在本地开发时加载，会覆盖 config.default.js 中的配置
 */
module.exports = {
  env: 'development',
  port: 3000,
  
  // 开发环境可以开启更详细的日志
  logger: {
    level: 'debug'
  },
  
  // 开发环境数据库配置示例
  database: {
    connection: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'test_dev'
    }
  }
};
