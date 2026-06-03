import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MONGO_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  KAFKA_BROKERS: Joi.string().required(),
  SWAGGER_PATH: Joi.string().default('docs'),

  // Verifies tokens issued by Identity (shared HS256 secret).
  JWT_SECRET: Joi.string().min(16).required(),

  APP_BASE_URL: Joi.string().uri().required(),

  // Identity internal user-lookup API (replaces the former in-DB user joins).
  IDENTITY_URL: Joi.string().uri().required(),
  INTERNAL_API_KEY: Joi.string().min(8).required(),
});
