import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-notifications-bell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './notifications-bell.component.html',
  styleUrl: './notifications-bell.component.css',
})
export class NotificationsBellComponent {
  private readonly notifications = inject(NotificationsService);

  readonly count = this.notifications.unreadCount;
  readonly countLabel = computed(() => {
    const value = this.count();
    return value > 99 ? '99+' : String(value);
  });
  readonly ariaLabel = computed(() => {
    const value = this.count();
    if (value === 0) return 'Notifications';
    return `Notifications, ${value} unread`;
  });
}
