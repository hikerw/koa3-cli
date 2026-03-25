/**
 * Default config loaded in all environments.
 */
module.exports = {
  // Application name
  name: 'koa3-cli',

  // Runtime env: development, production, test
  env: process.env.NODE_ENV || 'development',

  // Server port
  port: process.env.PORT || 3000,

  // Cookie signing keys
  keys: process.env.KEYS ? process.env.KEYS.split(',') : ['koa3-cli-secret-key'],

  // Static assets
  static: {
    enable: true,
    dir: 'public',
    options: {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      gzip: true
    }
  },

  // 素材上传（目录相对项目根目录，URL 需与 static 下路径一致）
  upload: {
    dir: 'public/uploads/materials', // 上传目录相对项目根目录
    publicPath: '/uploads/materials', // 公共访问路径
    maxFileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE) || 200 * 1024 * 1024 // 200MB
  },

  // Docs build config
  docs: {
    enable: true,
    buildDir: 'public/docs'
  },

  // View engine
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

  // bodyParser
  bodyParser: {
    enableTypes: ['json', 'form', 'text'],
    jsonLimit: '10mb',
    formLimit: '10mb'
  },

  // Database (example)
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

  // Redis (example)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0
  },

  // JWT（登录签发与接口鉴权，环境配置可覆盖 secret）
  jwt: {
    secret: process.env.JWT_SECRET || 'koa3-cli-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Logger
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE !== 'false'
  }
};
