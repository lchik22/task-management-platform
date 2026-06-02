import { ConfigService } from '@nestjs/config';

export interface ProxyRoute {
  target: string;
  /**
   * Limits which request paths this route proxies. Omit for a catch-all.
   * http-proxy-middleware forwards the original path unchanged (no strip).
   */
  pathFilter?: string | string[];
}

export function buildProxyRoutes(config: ConfigService): ProxyRoute[] {
  const monolithUrl =
    config.get<string>('MONOLITH_URL') ?? 'http://localhost:3001';

  return [
    // Strangler-fig seam: as services are carved out, add more-specific routes
    // ABOVE the catch-all, e.g.
    //   { target: notificationsUrl, pathFilter: '/notifications' },
    // and the rest keeps falling through to the monolith below.
    { target: monolithUrl },
  ];
}
