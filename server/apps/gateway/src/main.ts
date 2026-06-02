import type { ServerResponse } from 'node:http';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { RequestHandler } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';
import { buildProxyRoutes } from './proxy.routes';

async function bootstrap() {
  // bodyParser disabled so request bodies stream straight to the upstream;
  // a parsed body would otherwise break proxied POST/PUT/PATCH requests.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  for (const route of buildProxyRoutes(config)) {
    const proxy = createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
      ...(route.pathFilter ? { pathFilter: route.pathFilter } : {}),
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
