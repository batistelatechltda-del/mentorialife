const Joi = require("joi");

const createJournalSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    content: Joi.string().required(),
    is_auto: Joi.boolean().optional().allow(""),
  }),
});

const updateJournalSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({ id: Joi.string().uuid() }),
  body: Joi.object({
    content: Joi.string().required(),
    is_auto: Joi.boolean().optional(),
  }),
});

module.exports = {
  createJournalSchema,
  updateJournalSchema,
};
