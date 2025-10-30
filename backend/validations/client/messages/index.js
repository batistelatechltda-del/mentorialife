const Joi = require("joi");

const createMessageSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    conversationId: Joi.string().allow(''),
    message: Joi.string().required(),
    is_flagged: Joi.boolean().optional(),
  }),
});

const updateMessageSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    message: Joi.string().required(),
    is_flagged: Joi.boolean().optional(),
  }),
});

module.exports = {
  createMessageSchema,
  updateMessageSchema,
};
