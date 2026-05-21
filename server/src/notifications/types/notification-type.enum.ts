import { NotificationEvent } from '../../messaging/messaging.constants';

export const NotificationType = {
  TaskAssigned: NotificationEvent.TaskAssigned,
  TaskStatusChanged: NotificationEvent.TaskStatusChanged,
  ProjectMemberAdded: NotificationEvent.ProjectMemberAdded,
  ProjectMemberRemoved: NotificationEvent.ProjectMemberRemoved,
} as const;

export type NotificationTypeName =
  (typeof NotificationType)[keyof typeof NotificationType];
