import { ConfigService } from '@nestjs/config';

export interface ProxyRoute {
  target: string;
  /**
   * Limits which request paths this route proxies. Omit for a catch-all.
   * A plain (non-glob) string matches by prefix — http-proxy-middleware tests
   * `req.url` with `startsWith` — so '/notifications' covers '/notifications',
   * '/notifications/unread-count', '/notifications/:id/read', and query strings
   * alike. The original path is forwarded unchanged (no prefix strip).
   */
  pathFilter?: string | string[];
}

export function buildProxyRoutes(config: ConfigService): ProxyRoute[] {
  const taskManagementUrl =
    config.get<string>('TASK_MANAGEMENT_URL') ?? 'http://localhost:3001';
  const identityUrl = config.get<string>('IDENTITY_URL');
  const notificationsUrl = config.get<string>('NOTIFICATIONS_URL');

  const routes: ProxyRoute[] = [];

  // Strangler-fig seam: the extracted services are matched first (disjoint
  // prefixes); anything not matched falls through to the task-management
  // catch-all at the bottom (projects, tasks, /me/project-invitations, health).
  if (identityUrl) {
    routes.push({ target: identityUrl, pathFilter: '/auth' });
    routes.push({ target: identityUrl, pathFilter: '/invitations' });
  }
  if (notificationsUrl) {
    routes.push({ target: notificationsUrl, pathFilter: '/notifications' });
  }

  routes.push({ target: taskManagementUrl });

  return routes;
}
