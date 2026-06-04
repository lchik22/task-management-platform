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
  /**
   * Optional path rewrite applied before forwarding (http-proxy-middleware
   * `pathRewrite`), e.g. to map a gateway-local path onto a service's path.
   */
  pathRewrite?: Record<string, string>;
}

export function buildProxyRoutes(config: ConfigService): ProxyRoute[] {
  const taskManagementUrl =
    config.get<string>('TASK_MANAGEMENT_URL') ?? 'http://localhost:3001';
  const identityUrl = config.get<string>('IDENTITY_URL');
  const notificationsUrl = config.get<string>('NOTIFICATIONS_URL');

  const routes: ProxyRoute[] = [];

  // Aggregated API docs: expose each service's OpenAPI JSON under
  // /api-docs/<service> (rewritten to that service's /docs-json) so the
  // gateway's single Swagger UI at /docs can list them all in one dropdown.
  routes.push({
    target: taskManagementUrl,
    pathFilter: '/api-docs/task-management',
    pathRewrite: { '^/api-docs/task-management': '/docs-json' },
  });
  if (identityUrl) {
    routes.push({
      target: identityUrl,
      pathFilter: '/api-docs/identity',
      pathRewrite: { '^/api-docs/identity': '/docs-json' },
    });
  }
  if (notificationsUrl) {
    routes.push({
      target: notificationsUrl,
      pathFilter: '/api-docs/notifications',
      pathRewrite: { '^/api-docs/notifications': '/docs-json' },
    });
  }

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
