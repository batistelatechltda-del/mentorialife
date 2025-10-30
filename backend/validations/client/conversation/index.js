const Joi = require("joi");

const createConversationSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    title: Joi.string().optional(),
  }),
});

const updateConversationSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    title: Joi.string().required(), 
  }),
});

module.exports = {
  createConversationSchema,
  updateConversationSchema,
};
