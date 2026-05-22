import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ListNotificationsQuery,
  ListNotificationsResult,
  Notification,
  UnreadCountResult,
} from '../models/notification';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/notifications`;

  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  list(query: ListNotificationsQuery = {}) {
    let params = new HttpParams();
    if (query.unread !== undefined) {
      params = params.set('unread', String(query.unread));
    }
    if (query.limit !== undefined) {
      params = params.set('limit', String(query.limit));
    }
    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }
    return this.http.get<ListNotificationsResult>(this.base, { params });
  }

  fetchUnreadCount() {
    return this.http
      .get<UnreadCountResult>(`${this.base}/unread-count`)
      .pipe(tap((res) => this._unreadCount.set(res.count)));
  }

  markRead(id: string) {
    return this.http
      .patch<Notification>(`${this.base}/${id}/read`, {})
      .pipe(
        tap(() => {
          const next = Math.max(0, this._unreadCount() - 1);
          this._unreadCount.set(next);
        }),
      );
  }

  markAllRead() {
    return this.http
      .patch<{ modified: number }>(`${this.base}/read-all`, {})
      .pipe(tap(() => this._unreadCount.set(0)));
  }

  resetUnreadCount(): void {
    this._unreadCount.set(0);
  }
}
