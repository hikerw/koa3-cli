/**
 * 统一响应与业务错误封装。
 *
 * 后端所有接口统一返回 { success, data, message } 结构：
 * - 成功：success=true，业务数据放在 data；
 * - 失败：success=false，message 说明原因（可选携带额外字段）。
 *
 * 失败有两种触发方式，取决于调用位置在全局错误处理中间件之前还是之后：
 * - reject：直接写响应，用于「全局错误处理之前」的中间件（此时 throw 不会被捕获）；
 * - throwError：抛出带状态码的错误，由 app/middleware/errorHandler.js 统一输出，
 *   用于「全局错误处理之后」的 controller / service 层。
 *
 * 抽成公共模块是为了消除各处手写的重复定义，并保证响应结构与前端
 * （http 拦截器按 success 字段解包 data）保持一致。
 */

/**
 * 成功响应：把业务数据写入 ctx.body 的 data 字段。
 * @param {import('koa').Context} ctx Koa 上下文
 * @param {*} data 业务数据，缺省为 null
 */
function ok(ctx, data = null) {
  ctx.body = { success: true, data };
}

/**
 * 直接返回失败响应（用于全局错误处理之前的中间件）。
 * @param {import('koa').Context} ctx Koa 上下文
 * @param {number} status HTTP 状态码
 * @param {string} message 错误提示
 * @param {Object} [extra] 额外字段，会合并进响应体（如 permission、code）
 */
function reject(ctx, status, message, extra = {}) {
  ctx.status = status;
  ctx.body = { success: false, message, ...extra };
}

/**
 * 抛出带状态码的业务错误（用于全局错误处理之后的 controller / service）。
 * @param {number} status HTTP 状态码
 * @param {string} message 错误提示
 */
function throwError(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

module.exports = { ok, reject, throwError };
