import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventsPublisher } from './events.publisher';
import {
  KAFKA_CLIENT_ID,
  NOTIFICATIONS_CLIENT,
} from '@app/contracts';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: NOTIFICATIONS_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: KAFKA_CLIENT_ID,
              brokers: config.getOrThrow<string>('KAFKA_BROKERS').split(','),
            },
            producerOnlyMode: true,
          },
        }),
      },
    ]),
  ],
  providers: [EventsPublisher],
  exports: [EventsPublisher],
})
export class MessagingModule {}
