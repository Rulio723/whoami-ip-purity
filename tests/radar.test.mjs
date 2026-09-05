import test from 'node:test';
import assert from 'node:assert/strict';
import { createRadarService } from '../src/radar.js';

test('Cloudflare Radar ASN summary remains independent from IP purity', async () => {
  let requestedUrl;
  let authorization;
  const service = createRadarService({
    apiToken: 'test-token',
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      authorization = options.headers.Authorization;
      return new Response(JSON.stringify({
        success: true,
        result: {
          summary_0: { human: '52.540000', bot: '47.460000' },
          meta: { lastUpdated: '2026-09-05T06:30:00Z' }
        }
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
  });

  const result = await service.lookup(32043);
  assert.equal(result.humanTraffic, 52.54);
  assert.equal(result.botTraffic, 47.46);
  assert.equal(result.trafficAvailable, true);
  assert.equal(result.trafficScope, 'AS32043 · 最近7天');
  assert.equal(requestedUrl.searchParams.get('asn'), '32043');
  assert.equal(requestedUrl.searchParams.get('dateRange'), '7d');
  assert.equal(authorization, 'Bearer test-token');
});

test('Radar service caches by ASN and reports unavailable data without a token', async () => {
  let calls = 0;
  const service = createRadarService({
    apiToken: 'test-token',
    fetchImpl: async () => {
      calls += 1;
      return new Response(JSON.stringify({
        success: true,
        result: { summary_0: { human: '53.32', bot: '46.68' }, meta: {} }
      }));
    }
  });

  await Promise.all([service.lookup(32043), service.lookup(32043)]);
  assert.equal(calls, 1);

  const unavailable = await createRadarService().lookup(32043);
  assert.equal(unavailable.trafficAvailable, false);
  assert.equal(unavailable.humanTraffic, null);
  assert.match(unavailable.trafficReason, /API Token/);
});
