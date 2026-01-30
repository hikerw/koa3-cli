/**
 * 默认配置文件
 * 所有环境都会加载此配置
 */
module.exports = {
  // 应用名称
  name: 'koa3-cli',
  
  // 运行环境: development, production, test
  env: process.env.NODE_ENV || 'development',
  
  // 服务端口
  port: process.env.PORT || 3000,
  
  // 密钥，用于加密cookie等
  keys: process.env.KEYS ? process.env.KEYS.split(',') : ['koa2-cli-secret-key'],
  
  // 静态资源配置
  static: {
    enable: true,
    dir: 'public',
    options: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1年
      gzip: true
    }
  },
  
  // VuePress 文档配置
  docs: {
    enable: true,
    buildDir: 'public/docs'
  },
  
  // 视图配置
  view: {
    enable: true,
    root: 'app/view',
    options: {
      extension: 'ejs',
      map: {
        html: 'ejs'
      }
    }
  },
  
  // bodyParser配置
  bodyParser: {
    enableTypes: ['json', 'form', 'text'],
    jsonLimit: '10mb',
    formLimit: '10mb'
  },
  
  // 数据库配置（示例）
  database: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'test'
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  // MongoDB 配置
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/koa3',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Redis配置（示例）
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0
  },
  

  // 日志配置
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    dir: 'logs'
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'koa3-admin-secret',
    expiresIn: '7d'
  }
};

