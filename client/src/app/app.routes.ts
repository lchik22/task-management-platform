import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/accept-invitation/accept-invitation.page').then(
        (m) => m.AcceptInvitationPage,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then(
        (m) => m.ShellComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'projects' },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/projects-list/projects-list.page').then(
            (m) => m.ProjectsListPage,
          ),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/project-detail/project-detail.page').then(
            (m) => m.ProjectDetailPage,
          ),
      },
      {
        path: 'project-invitations',
        loadComponent: () =>
          import(
            './features/projects/my-project-invitations/my-project-invitations.page'
          ).then((m) => m.MyProjectInvitationsPage),
      },
      {
        path: 'my-tasks',
        loadComponent: () =>
          import('./features/tasks/my-tasks/my-tasks.page').then(
            (m) => m.MyTasksPage,
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications/notifications.page').then(
            (m) => m.NotificationsPage,
          ),
      },
      {
        path: 'admin/invitations',
        canActivate: [adminGuard],
        loadComponent: () =>
          import(
            './features/invitations/admin-invitations/admin-invitations.page'
          ).then((m) => m.AdminInvitationsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
