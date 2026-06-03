import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>('APP_BASE_URL', 'http://localhost:4200'),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerPath = config.get<string>('SWAGGER_PATH', 'docs');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Identity Service API')
    .setDescription(
      'Authentication, users, and platform invitations for the Task Management Platform',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document);

  const port = config.get<number>('PORT', 3003);
  await app.listen(port);

  console.log(`Identity API running on http://localhost:${port}`);
  console.log(`Swagger docs on http://localhost:${port}/${swaggerPath}`);
}
void bootstrap();
