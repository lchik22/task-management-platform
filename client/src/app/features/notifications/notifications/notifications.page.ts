import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Notification,
  NotificationType,
} from '../../../core/models/notification';
import { NotificationsService } from '../../../core/services/notifications.service';
import { toErrorMessage } from '../../../shared/error-message';

@Component({
  selector: 'app-notifications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.css',
})
export class NotificationsPage implements OnInit {
  private readonly service = inject(NotificationsService);

  readonly items = signal<Notification[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly markingAll = signal(false);
  readonly busyId = signal<string | null>(null);
  readonly unreadOnly = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  toggleUnreadOnly(): void {
    this.unreadOnly.update((v) => !v);
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service
      .list({ unread: this.unreadOnly() ? true : undefined, limit: 20 })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.nextCursor.set(res.nextCursor);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.loadError.set(
            toErrorMessage(err, 'Could not load notifications.'),
          );
        },
      });
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor) return;
    this.loadingMore.set(true);
    this.service
      .list({
        unread: this.unreadOnly() ? true : undefined,
        limit: 20,
        cursor,
      })
      .subscribe({
        next: (res) => {
          this.items.update((cur) => [...cur, ...res.items]);
          this.nextCursor.set(res.nextCursor);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false),
      });
  }

  markRead(n: Notification): void {
    this.busyId.set(n.id);
    this.service.markRead(n.id).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.items.update((cur) =>
          cur.map((it) => (it.id === n.id ? updated : it)),
        );
      },
      error: () => this.busyId.set(null),
    });
  }

  markAllRead(): void {
    this.markingAll.set(true);
    this.service.markAllRead().subscribe({
      next: () => {
        this.markingAll.set(false);
        this.refresh();
      },
      error: () => this.markingAll.set(false),
    });
  }

  action(n: Notification): { route: unknown[]; label: string } | null {
    const data = n.data;
    if (n.type === NotificationType.ProjectInvitationCreated) {
      return { route: ['/project-invitations'], label: 'Review invitation' };
    }
    if (typeof data['projectId'] === 'string') {
      return { route: ['/projects', data['projectId']], label: 'Open project' };
    }
    return null;
  }

  title(n: Notification): string {
    switch (n.type) {
      case NotificationType.TaskAssigned:
        return 'Task assigned to you';
      case NotificationType.TaskStatusChanged:
        return 'Task status updated';
      case NotificationType.ProjectMemberAdded:
        return 'New project member';
      case NotificationType.ProjectMemberRemoved:
        return 'Removed from project';
      case NotificationType.ProjectInvitationCreated:
        return 'You were invited to a project';
      default:
        return 'Notification';
    }
  }

  summary(n: Notification): string {
    const data = n.data;
    const projectTitle =
      typeof data['projectTitle'] === 'string'
        ? data['projectTitle']
        : 'a project';
    const taskTitle =
      typeof data['taskTitle'] === 'string' ? data['taskTitle'] : 'a task';
    switch (n.type) {
      case NotificationType.TaskAssigned:
        return `You were assigned "${taskTitle}" in ${projectTitle}.`;
      case NotificationType.TaskStatusChanged: {
        const prev =
          typeof data['previousStatus'] === 'string'
            ? data['previousStatus']
            : '';
        const next =
          typeof data['newStatus'] === 'string' ? data['newStatus'] : '';
        return `"${taskTitle}" moved ${prev} → ${next} in ${projectTitle}.`;
      }
      case NotificationType.ProjectMemberAdded:
        return `A new member joined ${projectTitle}.`;
      case NotificationType.ProjectMemberRemoved:
        return `You were removed from ${projectTitle}.`;
      case NotificationType.ProjectInvitationCreated:
        return `You were invited to join "${projectTitle}".`;
      default:
        return '';
    }
  }
}
