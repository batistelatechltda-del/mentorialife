const Joi = require("joi");

const createReminderSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    message: Joi.string().required(),
    remind_at: Joi.date().iso().required(),
  }),
});

const updateReminderSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    message: Joi.string().optional(),
    remind_at: Joi.date().iso().optional(),
    is_sent: Joi.boolean().optional(),
    is_completed: Joi.boolean().optional(),
  }),
});

module.exports = {
  createReminderSchema,
  updateReminderSchema,
};
