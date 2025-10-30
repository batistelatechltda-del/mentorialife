const Joi = require("joi");

const createCalendarEventSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional().allow(null, ""),
    start_time: Joi.date().required(),
    end_time: Joi.date().optional().allow(null),
  }),
});

const updateCalendarEventSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional().allow(null, ""),
    start_time: Joi.date().optional(),
    is_completed: Joi.boolean().optional(),
    end_time: Joi.date().optional().allow(null),
  }),
});

module.exports = {
  createCalendarEventSchema,
  updateCalendarEventSchema,
};
