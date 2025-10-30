const { userTypeEnum } = require("../../enums");
const Joi = require("joi");

const userRegisterSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    social_id: Joi.string().optional(),
    platform: Joi.string().optional(),
    full_name: Joi.string().required(),

  }),
});

const userLoginSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
});

const forgotSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email(),
  }),
});

const socialLoginSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().required(),
    first_name: Joi.string().min(2).required(),
    last_name: Joi.string().min(2).required(),
    social_id: Joi.string().required(),
    platform: Joi.string().required(),
    type: Joi.string()
      .valid(...userTypeEnum)
      .required(),
  }),
});

const getUserByIdSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    user_id: Joi.number().min(1).required(),
  }),
  body: Joi.object({}),
});

const getAllUserSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({}),
});

const ResetPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    previous_password: Joi.string().min(6).required(),
    new_password: Joi.string().min(6).required(),
  }),
});

const forgotPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    new_password: Joi.string().min(6).required(),
  }),
});

const verifyOtpSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    otp: Joi.string().required(),
  }),
});
const regenerateOtpSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({}),
});


const profileUpdateSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    full_name: Joi.string().min(2).optional(),
    bio: Joi.string().optional().allow(''),
    mentor_name: Joi.string().optional().allow(''),
    phone_number: Joi.string().optional().allow(''),
  }),
});


module.exports = {
  verifyOtpSchema,
  userRegisterSchema,
  userLoginSchema,
  socialLoginSchema,
  ResetPasswordSchema,
  forgotPasswordSchema,
  forgotSchema,
  getAllUserSchema,
  getUserByIdSchema,
  regenerateOtpSchema,
  profileUpdateSchema
};



