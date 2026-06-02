import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  NOTIFICATIONS_CONSUMER_GROUP,
  NOTIFICATIONS_KAFKA_CLIENT_ID,
} from '@app/contracts';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // CORS stays per-service so the gateway keeps transparently passing headers
  // through (same model as Phase 0). Future cleanup: centralize at the gateway.
  app.enableCors({
    origin: config.get<string>('APP_BASE_URL', 'http://localhost:4200'),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Join the same consumer group the monolith used, so committed offsets carry
  // over and no event is double-handled during the handover.
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: NOTIFICATIONS_KAFKA_CLIENT_ID,
          brokers: config.getOrThrow<string>('KAFKA_BROKERS').split(','),
        },
        consumer: { groupId: NOTIFICATIONS_CONSUMER_GROUP },
        run: { autoCommit: true },
      },
    },
    { inheritAppConfig: true },
  );

  const swaggerPath = config.get<string>('SWAGGER_PATH', 'docs');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Notifications Service API')
    .setDescription('Notifications read / mark-read API for the Task Management Platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document);

  await app.startAllMicroservices();

  const port = config.get<number>('PORT', 3002);
  await app.listen(port);

  console.log(`Notifications API running on http://localhost:${port}`);
  console.log(
    `Notifications consumer listening on Kafka (group "${NOTIFICATIONS_CONSUMER_GROUP}")`,
  );
  console.log(`Swagger docs on http://localhost:${port}/${swaggerPath}`);
}
void bootstrap();
