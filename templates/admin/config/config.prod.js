/**
 * 生产环境配置
 * 只在生产环境加载，会覆盖 config.default.js 中的配置
 */
module.exports = {
  env: 'production',
  port: process.env.PORT || 3000,
  
  // 生产环境日志级别
  logger: {
    level: 'warn'
  },
  
  // 生产环境静态资源缓存
  static: {
    options: {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      gzip: true,
      brotli: true
    }
  },

  // 生产环境 Mongo 配置
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/koa3-prod'
  },

  // JWT 配置覆盖（可选）
  jwt: {
    secret: process.env.JWT_SECRET || 'koa3-admin-secret-prod',
    expiresIn: '7d'
  }
};


