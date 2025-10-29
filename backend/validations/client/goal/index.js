const Joi = require("joi");

const createGoalSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow(null, '').optional(),
    due_date: Joi.date().iso().optional(),
  }),
});

const updateGoalSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().allow(null, '').optional(),
    is_completed: Joi.boolean().optional(),
    due_date: Joi.date().iso().optional(),
  }),
});

module.exports = {
  createGoalSchema,
  updateGoalSchema,
};
