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
  }
};
