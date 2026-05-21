import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventPayloads } from './events.types';
import { NOTIFICATIONS_CLIENT } from './messaging.constants';

@Injectable()
export class EventsPublisher {
  private readonly logger = new Logger(EventsPublisher.name);

  constructor(
    @Inject(NOTIFICATIONS_CLIENT) private readonly client: ClientProxy,
  ) {}

  publish<E extends keyof EventPayloads>(
    event: E,
    payload: EventPayloads[E],
  ): void {
    this.logger.debug(`Publishing ${event}`);
    this.client.emit(event, payload);
  }
}
