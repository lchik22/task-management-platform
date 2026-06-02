import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3002),
  MONGO_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  KAFKA_BROKERS: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  APP_BASE_URL: Joi.string().uri().required(),
  SWAGGER_PATH: Joi.string().default('docs'),
});
