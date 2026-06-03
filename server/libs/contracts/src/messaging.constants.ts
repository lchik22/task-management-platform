export const NOTIFICATIONS_CLIENT = 'NOTIFICATIONS_CLIENT';
export const NOTIFICATIONS_CONSUMER_GROUP = 'notifications-consumer';
// Kafka client id of the task-management service (event producer).
export const KAFKA_CLIENT_ID = 'task-management-server';
// Kafka client id of the standalone notifications service (event consumer).
export const NOTIFICATIONS_KAFKA_CLIENT_ID = 'notifications-service';

export const NotificationEvent = {
  TaskAssigned: 'task.assigned',
  TaskStatusChanged: 'task.status_changed',
  ProjectMemberAdded: 'project.member_added',
  ProjectMemberRemoved: 'project.member_removed',
  ProjectInvitationCreated: 'project.invitation_created',
} as const;

export type NotificationEventName =
  (typeof NotificationEvent)[keyof typeof NotificationEvent];
