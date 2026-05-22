import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { interval } from 'rxjs';
import { AuthService } from './../../../core/services/auth.service';
import { NotificationsService } from './../../../core/services/notifications.service';
import { NotificationsBellComponent } from '../notifications-bell/notifications-bell.component';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NotificationsBellComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.auth.user;
  readonly isAdmin = this.auth.isAdmin;
  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  });

  ngOnInit(): void {
    this.auth.fetchMe().subscribe({ error: () => undefined });
    this.notifications
      .fetchUnreadCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
    interval(30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.notifications
          .fetchUnreadCount()
          .subscribe({ error: () => undefined });
      });
  }

  logout(): void {
    this.notifications.resetUnreadCount();
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
