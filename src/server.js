import { createApp } from './app.js';
import { createMaxMindService } from './maxmind.js';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const trustCloudflare = process.env.TRUST_CF_CONNECTING_IP !== 'false';
const ipOverride = process.env.DEV_IP_OVERRIDE || '';
const geoService = await createMaxMindService();
const app = createApp({ geoService, trustCloudflare, ipOverride });

const server = app.listen(port, host, () => {
  console.log(`whoami listening on http://${host}:${port}`);
  console.log(`MaxMind City: ${geoService.paths.city}`);
  console.log(`MaxMind ASN: ${geoService.paths.asn}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
