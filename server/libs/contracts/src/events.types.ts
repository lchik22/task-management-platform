import { NotificationEvent } from './messaging.constants';

export interface TaskAssignedPayload {
  taskId: string;
  projectId: string;
  projectTitle: string;
  taskTitle: string;
  assigneeId: string;
  actorId: string;
}

export interface TaskStatusChangedPayload {
  taskId: string;
  projectId: string;
  projectTitle: string;
  taskTitle: string;
  previousStatus: string;
  newStatus: string;
  creatorId: string;
  assigneeId: string | null;
  actorId: string;
}

export interface ProjectMemberAddedPayload {
  projectId: string;
  projectTitle: string;
  memberId: string;
  ownerId: string;
  actorId: string;
}

export interface ProjectMemberRemovedPayload {
  projectId: string;
  projectTitle: string;
  removedUserId: string;
  actorId: string;
}

export interface ProjectInvitationCreatedPayload {
  invitationId: string;
  projectId: string;
  projectTitle: string;
  inviteeId: string;
  inviterId: string;
  actorId: string;
}

export interface EventPayloads {
  [NotificationEvent.TaskAssigned]: TaskAssignedPayload;
  [NotificationEvent.TaskStatusChanged]: TaskStatusChangedPayload;
  [NotificationEvent.ProjectMemberAdded]: ProjectMemberAddedPayload;
  [NotificationEvent.ProjectMemberRemoved]: ProjectMemberRemovedPayload;
  [NotificationEvent.ProjectInvitationCreated]: ProjectInvitationCreatedPayload;
}
