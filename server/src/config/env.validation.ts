import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MONGO_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
  RABBITMQ_URI: Joi.string().uri({ scheme: ['amqp', 'amqps'] }).required(),
  SWAGGER_PATH: Joi.string().default('docs'),
});
