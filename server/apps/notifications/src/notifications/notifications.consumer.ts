import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import type {
  ProjectInvitationCreatedPayload,
  ProjectMemberAddedPayload,
  ProjectMemberRemovedPayload,
  TaskAssignedPayload,
  TaskStatusChangedPayload,
} from '@app/contracts';
import { NotificationEvent } from '@app/contracts';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsConsumer {
  private readonly logger = new Logger(NotificationsConsumer.name);

  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern(NotificationEvent.TaskAssigned)
  async handleTaskAssigned(
    @Payload() payload: TaskAssignedPayload,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    await this.process(NotificationEvent.TaskAssigned, context, () =>
      this.notifications.onTaskAssigned(payload),
    );
  }

  @EventPattern(NotificationEvent.TaskStatusChanged)
  async handleTaskStatusChanged(
    @Payload() payload: TaskStatusChangedPayload,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    await this.process(NotificationEvent.TaskStatusChanged, context, () =>
      this.notifications.onTaskStatusChanged(payload),
    );
  }

  @EventPattern(NotificationEvent.ProjectMemberAdded)
  async handleProjectMemberAdded(
    @Payload() payload: ProjectMemberAddedPayload,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    await this.process(NotificationEvent.ProjectMemberAdded, context, () =>
      this.notifications.onProjectMemberAdded(payload),
    );
  }

  @EventPattern(NotificationEvent.ProjectMemberRemoved)
  async handleProjectMemberRemoved(
    @Payload() payload: ProjectMemberRemovedPayload,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    await this.process(NotificationEvent.ProjectMemberRemoved, context, () =>
      this.notifications.onProjectMemberRemoved(payload),
    );
  }

  @EventPattern(NotificationEvent.ProjectInvitationCreated)
  async handleProjectInvitationCreated(
    @Payload() payload: ProjectInvitationCreatedPayload,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    await this.process(
      NotificationEvent.ProjectInvitationCreated,
      context,
      () => this.notifications.onProjectInvitationCreated(payload),
    );
  }

  private async process(
    event: string,
    context: KafkaContext,
    handler: () => Promise<void>,
  ): Promise<void> {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const { offset } = context.getMessage();
    const location = `${topic}:${partition}@${offset}`;
    this.logger.debug(`Received ${event} [${location}]`);
    try {
      await handler();
    } catch (err) {
      this.logger.error(`Failed to handle ${event} [${location}]`, err);
    }
  }
}
