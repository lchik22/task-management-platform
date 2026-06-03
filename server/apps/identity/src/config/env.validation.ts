import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3003),
  MONGO_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  SWAGGER_PATH: Joi.string().default('docs'),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().min(8).required(),

  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().port().required(),
  MAIL_FROM: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),

  APP_BASE_URL: Joi.string().uri().required(),

  // Shared secret the task-management service presents on the internal user-lookup API.
  INTERNAL_API_KEY: Joi.string().min(8).required(),
});
