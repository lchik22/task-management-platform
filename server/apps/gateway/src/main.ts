import type { ServerResponse } from 'node:http';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { RequestHandler } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as swaggerUi from 'swagger-ui-express';
import { AppModule } from './app.module';
import { buildProxyRoutes } from './proxy.routes';

async function bootstrap() {
  // bodyParser disabled so request bodies stream straight to the upstream;
  // a parsed body would otherwise break proxied POST/PUT/PATCH requests.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  // Aggregated API docs: one Swagger UI at /docs with a per-service dropdown.
  // Each spec is proxied from its owning service via /api-docs/<service>
  // (see buildProxyRoutes), so even "Try it out" runs back through the gateway.
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      urls: [
        { url: '/api-docs/task-management', name: 'Task Management' },
        { url: '/api-docs/identity', name: 'Identity' },
        { url: '/api-docs/notifications', name: 'Notifications' },
      ],
    },
  };
  app.use(
    '/docs',
    swaggerUi.serveFiles(undefined, swaggerUiOptions),
    swaggerUi.setup(undefined, swaggerUiOptions),
  );

  for (const route of buildProxyRoutes(config)) {
    const proxy = createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
      ...(route.pathFilter ? { pathFilter: route.pathFilter } : {}),
      ...(route.pathRewrite ? { pathRewrite: route.pathRewrite } : {}),
      on: {
        error: (_err, _req, res) => {
          const httpRes = res as ServerResponse;
          if ('writeHead' in httpRes && !httpRes.headersSent) {
            httpRes.writeHead(502, { 'Content-Type': 'application/json' });
            httpRes.end(
              JSON.stringify({ statusCode: 502, message: 'Bad Gateway' }),
            );
          }
        },
      },
    });
    app.use(proxy as unknown as RequestHandler);
  }

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
