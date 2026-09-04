import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeIpPurity, createPurityService } from '../src/purity.js';

test('known hosting ASN produces the expected light-risk score', () => {
  const result = analyzeIpPurity({
    ip: '216.40.85.151',
    geo: { asn: 1054, provider: 'Zont LLC', countryCode: 'US' },
    hostname: 'customer.zont.io'
  });

  assert.equal(result.riskScore, 42);
  assert.equal(result.purityScore, 58);
  assert.equal(result.level, '轻度风险');
  assert.equal(result.networkType, '机房 / 云服务');
});

test('residential and anonymizer signals affect score in opposite directions', () => {
  const residential = analyzeIpPurity({
    ip: '1.1.1.1',
    geo: { asn: 64500, provider: 'Example Broadband Communications', countryCode: 'US' },
    hostname: 'pool-1-1-1-1.dynamic.example.net'
  });
  const proxy = analyzeIpPurity({
    ip: '2.2.2.2',
    geo: { asn: 64501, provider: 'Example VPN Proxy', countryCode: 'NL' },
    hostname: 'tor-exit.example.net'
  });

  assert.equal(residential.riskScore, 0);
  assert.equal(residential.level, '纯净');
  assert.ok(proxy.riskScore >= 65);
  assert.equal(proxy.networkType, '匿名代理');
});

test('purity service de-duplicates and caches reverse DNS lookups', async () => {
  let calls = 0;
  const service = createPurityService({
    hostnameLookup: async () => { calls += 1; return 'host.example.net'; },
    ttlMs: 60_000
  });
  const geo = { asn: 64500, provider: 'Example Broadband', countryCode: 'US' };
  const [first, second] = await Promise.all([
    service.lookup('1.1.1.1', geo),
    service.lookup('1.1.1.1', geo)
  ]);

  assert.equal(calls, 1);
  assert.deepEqual(first, second);
});
