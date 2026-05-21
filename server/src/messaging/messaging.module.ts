import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventsPublisher } from './events.publisher';
import {
  NOTIFICATIONS_CLIENT,
  NOTIFICATIONS_QUEUE,
} from './messaging.constants';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: NOTIFICATIONS_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBITMQ_URI')],
            queue: NOTIFICATIONS_QUEUE,
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  providers: [EventsPublisher],
  exports: [EventsPublisher],
})
export class MessagingModule {}
