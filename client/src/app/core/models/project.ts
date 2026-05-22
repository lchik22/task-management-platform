export const ProjectRole = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const;

export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

export const ProjectInvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  REVOKED: 'REVOKED',
} as const;

export type ProjectInvitationStatus =
  (typeof ProjectInvitationStatus)[keyof typeof ProjectInvitationStatus];

export interface ProjectMember {
  user: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  owner: string;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithRole extends Project {
  role: ProjectRole;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
}

export interface CreateProjectInvitationRequest {
  email: string;
}

interface PopulatedUserRef {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface PopulatedProjectRef {
  id: string;
  title?: string;
}

export interface ProjectInvitation {
  id: string;
  project: string | PopulatedProjectRef;
  invitee: string | PopulatedUserRef;
  inviter: string | PopulatedUserRef;
  status: ProjectInvitationStatus;
  createdAt: string;
  updatedAt: string;
}
