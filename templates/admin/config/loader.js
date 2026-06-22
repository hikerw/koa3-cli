/**
 * 配置加载器：合并 default + 环境配置
 */
const path = require('path');

const defaultConfig = require('./config.default');

function loadConfig() {
  const env = process.env.NODE_ENV || 'development';
  let envConfig = {};

  try {
    if (env === 'production') {
      envConfig = require('./config.prod');
    } else if (env === 'local' || env === 'development') {
      envConfig = require('./config.local');
    }
  } catch (e) {
    // 忽略缺失的环境配置文件
  }

  return Object.assign({}, defaultConfig, envConfig);
}

module.exports = { loadConfig };
