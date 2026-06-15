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

  // CORS configuration
  // 默认关闭跨域，避免新项目在没有明确安全边界时暴露给任意来源。
  // 如需开放给前端应用，可设置 CORS_ENABLE=true，并用 CORS_ORIGIN 指定允许的来源。
  cors: {
    enable: process.env.CORS_ENABLE === 'true',
    options: {
      origin: process.env.CORS_ORIGIN || '*'
    }
  },

  // Static assets
  static: {
    enable: true,
    dir: 'public',
    options: {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      gzip: true
    }
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

  // Logger
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE !== 'false'
  }
};
