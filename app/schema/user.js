const { Joi } = require('../lib/validator');

const idParam = Joi.object({
  id: Joi.string().required().messages({ 'any.required': '用户 id 不能为空' })
});

const createUserBody = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': '用户名为必填',
    'string.empty': '用户名不能为空',
    'string.max': '用户名不能超过 100 个字符'
  }),
  email: Joi.string().email().allow('').optional(),
  age: Joi.number().integer().min(0).max(150).optional()
}).options({ stripUnknown: true });

const updateUserBody = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  email: Joi.string().email().allow('').optional(),
  age: Joi.number().integer().min(0).max(150).optional()
}).min(1).messages({
  'object.min': '至少需要提供一个要更新的字段'
}).options({ stripUnknown: true });

module.exports = {
  idParam,
  createUserBody,
  updateUserBody
};
