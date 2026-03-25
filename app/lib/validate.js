const Joi = require('joi');
const { mongoose } = require('../model/db');

function objectIdAllowEmpty(value, helpers) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (!mongoose.isValidObjectId(s)) return helpers.error('any.invalid');
  return s;
}

function objectIdArray(value, helpers) {
  if (value == null) return [];
  if (!Array.isArray(value)) return helpers.error('array.base');
  const out = [];
  for (const v of value) {
    const s = String(v).trim();
    if (!s) continue;
    if (!mongoose.isValidObjectId(s)) return helpers.error('any.invalid');
    out.push(s);
  }
  return out;
}

function validateBody(ctx, schema, opts = {}) {
  const { value, error } = schema.validate(ctx.request.body || {}, {
    abortEarly: true,
    convert: true,
    ...opts
  });
  if (!error) return value;
  ctx.status = 400;
  ctx.body = { message: error.details?.[0]?.message || '参数校验失败' };
  return null;
}

function requireParamObjectId(ctx, key = 'id', message = 'id 不能为空或不合法') {
  const raw = ctx?.params?.[key];
  const s = raw != null ? String(raw).trim() : '';
  if (!s || !mongoose.isValidObjectId(s)) {
    ctx.status = 400;
    ctx.body = { message };
    return null;
  }
  return s;
}

module.exports = {
  Joi,
  objectIdAllowEmpty,
  objectIdArray,
  validateBody,
  requireParamObjectId
};

