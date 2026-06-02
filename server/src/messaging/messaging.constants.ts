export const NOTIFICATIONS_CLIENT = 'NOTIFICATIONS_CLIENT';
export const NOTIFICATIONS_CONSUMER_GROUP = 'notifications-consumer';
export const KAFKA_CLIENT_ID = 'task-management-server';

export const NotificationEvent = {
  TaskAssigned: 'task.assigned',
  TaskStatusChanged: 'task.status_changed',
  ProjectMemberAdded: 'project.member_added',
  ProjectMemberRemoved: 'project.member_removed',
  ProjectInvitationCreated: 'project.invitation_created',
} as const;

export type NotificationEventName =
  (typeof NotificationEvent)[keyof typeof NotificationEvent];
