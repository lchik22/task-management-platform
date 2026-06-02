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
  const monolithUrl =
    config.get<string>('MONOLITH_URL') ?? 'http://localhost:3001';
  const notificationsUrl = config.get<string>('NOTIFICATIONS_URL');

  const routes: ProxyRoute[] = [];

  // Strangler-fig seam: carved-out services are matched first; anything not
  // matched falls through to the monolith catch-all at the bottom. As more
  // services are extracted, add their routes here, ABOVE the catch-all.
  if (notificationsUrl) {
    routes.push({ target: notificationsUrl, pathFilter: '/notifications' });
  }

  routes.push({ target: monolithUrl });

  return routes;
}
