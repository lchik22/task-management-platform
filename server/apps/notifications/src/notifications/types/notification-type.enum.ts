import { NotificationEvent } from '@app/contracts';

export const NotificationType = {
  TaskAssigned: NotificationEvent.TaskAssigned,
  TaskStatusChanged: NotificationEvent.TaskStatusChanged,
  ProjectMemberAdded: NotificationEvent.ProjectMemberAdded,
  ProjectMemberRemoved: NotificationEvent.ProjectMemberRemoved,
  ProjectInvitationCreated: NotificationEvent.ProjectInvitationCreated,
} as const;

export type NotificationTypeName =
  (typeof NotificationType)[keyof typeof NotificationType];
