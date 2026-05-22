import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel, ConsumeMessage } from 'amqplib';
import type {
  ProjectInvitationCreatedPayload,
  ProjectMemberAddedPayload,
  ProjectMemberRemovedPayload,
  TaskAssignedPayload,
  TaskStatusChangedPayload,
} from '../messaging/events.types';
import { NotificationEvent } from '../messaging/messaging.constants';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsConsumer {
  private readonly logger = new Logger(NotificationsConsumer.name);

  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern(NotificationEvent.TaskAssigned)
  async handleTaskAssigned(
    @Payload() payload: TaskAssignedPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(NotificationEvent.TaskAssigned, context, () =>
      this.notifications.onTaskAssigned(payload),
    );
  }

  @EventPattern(NotificationEvent.TaskStatusChanged)
  async handleTaskStatusChanged(
    @Payload() payload: TaskStatusChangedPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(NotificationEvent.TaskStatusChanged, context, () =>
      this.notifications.onTaskStatusChanged(payload),
    );
  }

  @EventPattern(NotificationEvent.ProjectMemberAdded)
  async handleProjectMemberAdded(
    @Payload() payload: ProjectMemberAddedPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(NotificationEvent.ProjectMemberAdded, context, () =>
      this.notifications.onProjectMemberAdded(payload),
    );
  }

  @EventPattern(NotificationEvent.ProjectMemberRemoved)
  async handleProjectMemberRemoved(
    @Payload() payload: ProjectMemberRemovedPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(NotificationEvent.ProjectMemberRemoved, context, () =>
      this.notifications.onProjectMemberRemoved(payload),
    );
  }

  @EventPattern(NotificationEvent.ProjectInvitationCreated)
  async handleProjectInvitationCreated(
    @Payload() payload: ProjectInvitationCreatedPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(
      NotificationEvent.ProjectInvitationCreated,
      context,
      () => this.notifications.onProjectInvitationCreated(payload),
    );
  }

  private async process(
    event: string,
    context: RmqContext,
    handler: () => Promise<void>,
  ): Promise<void> {
    const channel = context.getChannelRef() as Channel;
    const message = context.getMessage() as ConsumeMessage;
    this.logger.debug(`Received ${event}`);
    try {
      await handler();
      channel.ack(message);
    } catch (err) {
      this.logger.error(`Failed to handle ${event}`, err);
      channel.nack(message, false, false);
    }
  }
}
