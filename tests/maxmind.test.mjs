import test from 'node:test';
import assert from 'node:assert/strict';
import { createMaxMindService, resolveDatabasePaths } from '../src/maxmind.js';

test('bundled MaxMind databases exist and resolve the reference IP exactly', async () => {
  const paths = resolveDatabasePaths({});
  const service = await createMaxMindService(paths);
  const result = service.lookup('216.40.85.151');

  assert.equal(result.city, '洛杉矶');
  assert.equal(result.postalCode, '90060');
  assert.equal(result.region, '加州');
  assert.equal(result.country, '美国');
  assert.equal(result.countryCode, 'US');
  assert.equal(result.timezone, 'America/Los_Angeles');
  assert.equal(result.network, '216.40.84.0/22');
  assert.equal(result.asn, 1054);
  assert.equal(result.asnName, 'ZONT-LLC');
  assert.equal(result.provider, 'Zont LLC');
});

test('MaxMind lookup returns an unknown record instead of inventing a CIDR', async () => {
  const service = await createMaxMindService();
  const result = service.lookup('127.0.0.1');
  assert.equal(result.network, '未知');
  assert.equal(result.asn, undefined);
});
