import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
import fs from 'node:fs';

function request(url, init, cf) {
  const req = new Request(url, init);
  Object.defineProperty(req, 'cf', { value: cf || {}, configurable: true });
  return req;
}

test('curl receives the true edge client IP as plain text', async () => {
  const response = await worker.fetch(request('https://example.com/', {
    headers: { 'CF-Connecting-IP': '203.0.113.45', Accept: '*/*' }
  }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=UTF-8');
  assert.equal(await response.text(), '203.0.113.45\n');
});

test('browser receives the same IP and Cloudflare metadata in HTML', async () => {
  const response = await worker.fetch(request('https://example.com/', {
    headers: {
      'CF-Connecting-IP': '203.0.113.45',
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/146.0.0.0 Safari/537.36'
    }
  }, {
    city: 'Los Angeles', postalCode: '90060', region: 'California', country: 'US',
    timezone: 'America/Los_Angeles', asn: 1054, asOrganization: 'ZONT-LLC',
    latitude: '34.0544', longitude: '-118.2440'
  }));
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /203\.0\.113\.45/);
  assert.match(html, /洛杉矶/);
  assert.match(html, /AS1054 ZONT-LLC/);
  assert.match(html, /203\.0\.112\.0\/22/);
  assert.match(html, /MaxMind/);
  assert.match(html, />Zont LLC</);
  assert.match(html, /curl whoami\.moe/);
  assert.match(html, /Chrome 146/);
  assert.match(html, /id="fp-full"/);
});

test('API exposes IP and request metadata without persistence', async () => {
  const response = await worker.fetch(request('https://example.com/api/info', {
    headers: { 'CF-Connecting-IP': '2001:db8::1', 'User-Agent': 'curl/8.0' }
  }, { country: 'SG', asn: 13335 }));
  const body = await response.json();
  assert.equal(body.ip, '2001:db8::1');
  assert.equal(body.cf.country, 'SG');
});

test('transaction artifact matches the deployed worker source', () => {
  assert.equal(fs.readFileSync(new URL('../MODIFIED_FILE', import.meta.url), 'utf8'), fs.readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8'));
});
