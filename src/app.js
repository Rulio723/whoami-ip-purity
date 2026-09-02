import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { lookupHostname } from './hostname.js';
import { detectClient, getClientIp } from './ip.js';
import { renderPage } from './template.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function createApp({ geoService, trustCloudflare = true, ipOverride = '', hostnameLookup = lookupHostname } = {}) {
  if (!geoService) throw new Error('geoService is required');
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(express.static(path.join(root, 'public'), {
    etag: true,
    setHeaders(response, filePath) {
      if (/[-.][A-Za-z0-9_-]{8,}\.(?:js|css|woff2)$/.test(path.basename(filePath))) {
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        response.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  }));

  app.get('/healthz', (_request, response) => {
    response.json({ status: 'ok', database: 'MaxMind GeoLite2 City + ASN' });
  });

  app.get('/hostname', async (request, response) => {
    const ip = ipOverride || getClientIp(request, { trustCloudflare });
    const hostname = await hostnameLookup(ip);
    response.set('Cache-Control', 'no-store');
    response.type('text/plain').send(hostname);
  });

  app.get('/api/info', (request, response) => {
    const ip = ipOverride || getClientIp(request, { trustCloudflare });
    response.set('Cache-Control', 'no-store');
    response.json({
      ip,
      ...geoService.lookup(ip),
      ...detectClient(request.get('User-Agent') || '')
    });
  });

  app.get('/', (request, response) => {
    const ip = ipOverride || getClientIp(request, { trustCloudflare });
    response.set('Cache-Control', 'no-store');

    if (!(request.get('Accept') || '').includes('text/html')) {
      response.type('text/plain').send(`${ip}\n`);
      return;
    }

    response
      .set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'")
      .set('Referrer-Policy', 'no-referrer')
      .set('X-Content-Type-Options', 'nosniff')
      .type('html')
      .send(renderPage({
        ip,
        geo: geoService.lookup(ip),
        client: detectClient(request.get('User-Agent') || '')
      }));
  });

  return app;
}
