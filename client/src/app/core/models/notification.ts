export const NotificationType = {
  TaskAssigned: 'task.assigned',
  TaskStatusChanged: 'task.status_changed',
  ProjectMemberAdded: 'project.member_added',
  ProjectMemberRemoved: 'project.member_removed',
  ProjectInvitationCreated: 'project.invitation_created',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface Notification {
  id: string;
  recipient: string;
  type: NotificationType;
  data: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsQuery {
  unread?: boolean;
  limit?: number;
  cursor?: string;
}

export interface ListNotificationsResult {
  items: Notification[];
  nextCursor: string | null;
}

export interface UnreadCountResult {
  count: number;
}
