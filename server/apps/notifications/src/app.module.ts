import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthModule } from '@app/auth';
import { envValidationSchema } from './config/env.validation';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    // Edge JWT verification (HS256 shared secret) — protects the REST routes;
    // Kafka event handlers bypass it (the guard allows non-HTTP contexts).
    JwtAuthModule,
    NotificationsModule,
  ],
})
export class AppModule {}
