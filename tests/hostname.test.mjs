import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupHostname } from '../src/hostname.js';

test('reverse DNS returns the first hostname without a trailing dot', async () => {
  const hostname = await lookupHostname('203.0.113.10', {
    reverse: async ip => {
      assert.equal(ip, '203.0.113.10');
      return ['edge.example.net.', 'backup.example.net.'];
    }
  });
  assert.equal(hostname, 'edge.example.net');
});

test('reverse DNS failures and invalid addresses return an empty response', async () => {
  assert.equal(await lookupHostname('not-an-ip'), '');
  assert.equal(await lookupHostname('203.0.113.10', {
    reverse: async () => { throw new Error('NXDOMAIN'); }
  }), '');
});

test('reverse DNS is bounded by its timeout', async () => {
  const hostname = await lookupHostname('203.0.113.10', {
    reverse: () => new Promise(() => {}),
    timeoutMs: 5
  });
  assert.equal(hostname, '');
});
