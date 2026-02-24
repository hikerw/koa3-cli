/**
 * 应用级配置，从环境变量读取，便于部署时定制
 * 在 client 目录下 .env 或 .env.local 中配置 VITE_APP_TITLE / VITE_APP_TITLE_SHORT
 */

const getEnv = (key, fallback = '') => {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
};

/** 应用完整标题（侧栏展开、登录页、页面 title） */
export const appTitle = getEnv('VITE_APP_TITLE', 'Koa3 Admin');

/** 侧栏折叠时显示的短标题（如 K3） */
export const appTitleShort = getEnv('VITE_APP_TITLE_SHORT', 'K3');
