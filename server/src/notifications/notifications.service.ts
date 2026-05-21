import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProjectMemberAddedPayload,
  ProjectMemberRemovedPayload,
  TaskAssignedPayload,
  TaskStatusChangedPayload,
} from '../messaging/events.types';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import {
  NotificationType,
  NotificationTypeName,
} from './types/notification-type.enum';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async onTaskAssigned(payload: TaskAssignedPayload): Promise<void> {
    const recipients = this.uniqueRecipients(
      [payload.assigneeId],
      payload.actorId,
    );
    await this.create(recipients, NotificationType.TaskAssigned, {
      taskId: payload.taskId,
      projectId: payload.projectId,
      projectTitle: payload.projectTitle,
      taskTitle: payload.taskTitle,
    });
  }

  async onTaskStatusChanged(payload: TaskStatusChangedPayload): Promise<void> {
    const candidates = [payload.creatorId];
    if (payload.assigneeId) candidates.push(payload.assigneeId);
    const recipients = this.uniqueRecipients(candidates, payload.actorId);
    await this.create(recipients, NotificationType.TaskStatusChanged, {
      taskId: payload.taskId,
      projectId: payload.projectId,
      projectTitle: payload.projectTitle,
      taskTitle: payload.taskTitle,
      previousStatus: payload.previousStatus,
      newStatus: payload.newStatus,
    });
  }

  async onProjectMemberAdded(
    payload: ProjectMemberAddedPayload,
  ): Promise<void> {
    const recipients = this.uniqueRecipients(
      [payload.ownerId],
      payload.actorId,
    );
    await this.create(recipients, NotificationType.ProjectMemberAdded, {
      projectId: payload.projectId,
      projectTitle: payload.projectTitle,
      memberId: payload.memberId,
    });
  }

  async onProjectMemberRemoved(
    payload: ProjectMemberRemovedPayload,
  ): Promise<void> {
    const recipients = this.uniqueRecipients(
      [payload.removedUserId],
      payload.actorId,
    );
    await this.create(recipients, NotificationType.ProjectMemberRemoved, {
      projectId: payload.projectId,
      projectTitle: payload.projectTitle,
    });
  }

  async listForUser(
    userId: Types.ObjectId,
    query: ListNotificationsQueryDto,
  ): Promise<{ items: NotificationDocument[]; nextCursor: string | null }> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const filter: Record<string, unknown> = { recipient: userId };
    if (query.unread === true) filter.read = false;
    if (query.cursor) {
      const cursorDate = new Date(query.cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        filter.createdAt = { $lt: cursorDate };
      }
    }

    const items = await this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .exec();

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const overflow = items.pop()!;
      const last = items[items.length - 1];
      nextCursor = (last.get('createdAt') as Date).toISOString();
      void overflow;
    }

    return { items, nextCursor };
  }

  countUnread(userId: Types.ObjectId): Promise<number> {
    return this.notificationModel
      .countDocuments({ recipient: userId, read: false })
      .exec();
  }

  async markRead(
    userId: Types.ObjectId,
    notificationId: string,
  ): Promise<NotificationDocument> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new NotFoundException('Notification not found');
    }
    const notification = await this.notificationModel
      .findOne({ _id: notificationId, recipient: userId })
      .exec();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }
    return notification;
  }

  async markAllRead(userId: Types.ObjectId): Promise<{ modified: number }> {
    const result = await this.notificationModel
      .updateMany(
        { recipient: userId, read: false },
        { $set: { read: true, readAt: new Date() } },
      )
      .exec();
    return { modified: result.modifiedCount };
  }

  private async create(
    recipientIds: string[],
    type: NotificationTypeName,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (recipientIds.length === 0) return;
    const docs = recipientIds.map((id) => ({
      recipient: new Types.ObjectId(id),
      type,
      data,
    }));
    try {
      await this.notificationModel.insertMany(docs);
    } catch (err) {
      this.logger.error(`Failed to persist notifications of type ${type}`, err);
      throw err;
    }
  }

  private uniqueRecipients(
    candidates: Array<string | null | undefined>,
    actorId: string,
  ): string[] {
    const out = new Set<string>();
    for (const c of candidates) {
      if (c && c !== actorId) out.add(c);
    }
    return [...out];
  }
}
