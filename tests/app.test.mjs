import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { createMaxMindService } from '../src/maxmind.js';

async function withServer(run) {
  const geoService = await createMaxMindService();
  const server = createApp({ geoService }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('curl receives CF-Connecting-IP as plain text', async () => {
  await withServer(async origin => {
    const response = await fetch(origin, {
      headers: { 'CF-Connecting-IP': '216.40.85.151', Accept: '*/*' }
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/plain/);
    assert.equal(await response.text(), '216.40.85.151\n');
  });
});

test('browser HTML is rendered from MaxMind City and ASN records', async () => {
  await withServer(async origin => {
    const response = await fetch(origin, {
      headers: {
        'CF-Connecting-IP': '216.40.85.151',
        Accept: 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/146.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    assert.match(html, /216\.40\.85\.151/);
    assert.match(html, /洛杉矶/);
    assert.match(html, /90060/);
    assert.match(html, /216\.40\.84\.0\/22/);
    assert.match(html, /AS1054 ZONT-LLC/);
    assert.match(html, />Zont LLC</);
    assert.match(html, /data-fingerprint=""/);
    assert.match(html, /:text="data\.fingerprint/);
  });
});

test('JSON API and health endpoint report MaxMind-backed state', async () => {
  await withServer(async origin => {
    const info = await fetch(`${origin}/api/info`, {
      headers: { 'CF-Connecting-IP': '216.40.85.151' }
    }).then(response => response.json());
    assert.equal(info.network, '216.40.84.0/22');
    assert.equal(info.provider, 'Zont LLC');

    const health = await fetch(`${origin}/healthz`).then(response => response.json());
    assert.deepEqual(health, { status: 'ok', database: 'MaxMind GeoLite2 City + ASN' });
  });
});
