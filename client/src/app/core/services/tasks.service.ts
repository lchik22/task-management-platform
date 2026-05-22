import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  CreateTaskRequest,
  ListTasksQuery,
  Task,
  TaskStatus,
  UpdateTaskRequest,
} from '../models/task';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiBaseUrl;

  list(projectId: string, query: ListTasksQuery = {}) {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.priority) params = params.set('priority', query.priority);
    if (query.assignee) params = params.set('assignee', query.assignee);
    return this.http.get<Task[]>(`${this.api}/projects/${projectId}/tasks`, {
      params,
    });
  }

  create(projectId: string, payload: CreateTaskRequest) {
    return this.http.post<Task>(
      `${this.api}/projects/${projectId}/tasks`,
      payload,
    );
  }

  get(projectId: string, taskId: string) {
    return this.http.get<Task>(
      `${this.api}/projects/${projectId}/tasks/${taskId}`,
    );
  }

  update(projectId: string, taskId: string, payload: UpdateTaskRequest) {
    return this.http.patch<Task>(
      `${this.api}/projects/${projectId}/tasks/${taskId}`,
      payload,
    );
  }

  updateStatus(projectId: string, taskId: string, status: TaskStatus) {
    return this.http.patch<Task>(
      `${this.api}/projects/${projectId}/tasks/${taskId}/status`,
      { status },
    );
  }

  remove(projectId: string, taskId: string) {
    return this.http.delete<void>(
      `${this.api}/projects/${projectId}/tasks/${taskId}`,
    );
  }

  listMine(status?: TaskStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Task[]>(`${this.api}/tasks/mine`, { params });
  }
}
