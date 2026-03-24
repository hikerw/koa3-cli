const Joi = require('joi');

/**
 * 根据 schemas 生成 Koa 参数校验中间件
 * @param {Object} schemas - { body?: Joi.Schema, query?: Joi.Schema, params?: Joi.Schema }
 * @returns {Function} Koa middleware
 *
 * 校验通过后，结果会挂到 ctx.state.validated 上：
 *   ctx.state.validated.body / .query / .params
 */
function validate(schemas = {}) {
  return async function validateMiddleware(ctx, next) {
    const result = {};

    try {
      if (schemas.body) {
        const value = ctx.request.body ?? {};
        result.body = await schemas.body.validateAsync(value, { stripUnknown: true });
      }
      if (schemas.query) {
        const value = ctx.query ?? {};
        result.query = await schemas.query.validateAsync(value, { stripUnknown: true });
      }
      if (schemas.params) {
        const value = ctx.params ?? {};
        result.params = await schemas.params.validateAsync(value, { stripUnknown: true });
      }
    } catch (err) {
      if (!Joi.isError(err)) {
        throw err;
      }
      const validationError = new Error(err.message || 'Validation Failed');
      validationError.status = 422;
      validationError.details = err.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      throw validationError;
    }

    ctx.state.validated = result;
    await next();
  };
}

/**
 * 在控制器内校验单个对象，失败时抛出与 validate() 中间件相同形态的 422 错误
 */
async function validateValue(schema, value, validateOptions = { stripUnknown: true }) {
  try {
    return await schema.validateAsync(value ?? {}, validateOptions);
  } catch (err) {
    if (!Joi.isError(err)) {
      throw err;
    }
    const validationError = new Error(err.message || 'Validation Failed');
    validationError.status = 422;
    validationError.details = err.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    throw validationError;
  }
}

module.exports = {
  validate,
  validateValue,
  Joi
};
