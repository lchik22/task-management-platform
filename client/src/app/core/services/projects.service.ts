import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  CreateProjectInvitationRequest,
  CreateProjectRequest,
  Project,
  ProjectInvitation,
  ProjectWithRole,
  UpdateProjectRequest,
} from '../models/project';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/projects`;
  private readonly mineBase = `${environment.apiBaseUrl}/me/project-invitations`;

  list() {
    return this.http.get<ProjectWithRole[]>(this.base);
  }

  create(payload: CreateProjectRequest) {
    return this.http.post<Project>(this.base, payload);
  }

  get(id: string) {
    return this.http.get<Project>(`${this.base}/${id}`);
  }

  update(id: string, payload: UpdateProjectRequest) {
    return this.http.patch<Project>(`${this.base}/${id}`, payload);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  leave(id: string) {
    return this.http.post<{ success: boolean }>(
      `${this.base}/${id}/leave`,
      {},
    );
  }

  removeMember(id: string, userId: string) {
    return this.http.delete<void>(`${this.base}/${id}/members/${userId}`);
  }

  listInvitations(id: string) {
    return this.http.get<ProjectInvitation[]>(`${this.base}/${id}/invitations`);
  }

  createInvitation(id: string, payload: CreateProjectInvitationRequest) {
    return this.http.post<ProjectInvitation>(
      `${this.base}/${id}/invitations`,
      payload,
    );
  }

  revokeInvitation(id: string, invitationId: string) {
    return this.http.delete<ProjectInvitation>(
      `${this.base}/${id}/invitations/${invitationId}`,
    );
  }

  listMyInvitations() {
    return this.http.get<ProjectInvitation[]>(this.mineBase);
  }

  acceptMyInvitation(invitationId: string) {
    return this.http.post<ProjectInvitation>(
      `${this.mineBase}/${invitationId}/accept`,
      {},
    );
  }

  declineMyInvitation(invitationId: string) {
    return this.http.post<ProjectInvitation>(
      `${this.mineBase}/${invitationId}/decline`,
      {},
    );
  }
}
