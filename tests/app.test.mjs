import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { createMaxMindService } from '../src/maxmind.js';
import { renderPurityPanel } from '../src/template.js';

async function withServer(run) {
  const geoService = await createMaxMindService();
  const radarService = {
    lookup: async asn => ({
      humanTraffic: 52.54,
      botTraffic: 47.46,
      trafficAvailable: true,
      trafficSource: 'Cloudflare Radar',
      trafficScope: `AS${asn} · 最近7天`,
      trafficUpdatedAt: '2026-09-05T06:30:00Z',
      trafficReason: ''
    })
  };
  const server = createApp({ geoService, hostnameLookup: async () => '', radarService }).listen(0, '127.0.0.1');
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
    assert.match(html, /curl rulio\.top/);
    assert.match(html, /property="og:url" content="https:\/\/rulio\.top\/"/);
    assert.doesNotMatch(html, /curl ip\.rulio\.sryze\.cc/);
    assert.match(html, /洛杉矶/);
    assert.match(html, /90060/);
    assert.match(html, /216\.40\.84\.0\/22/);
    assert.match(html, /AS1054 ZONT-LLC/);
    assert.match(html, />Zont LLC</);
    assert.match(html, /hx-get="\/hostname"/);
    assert.match(html, /openstreetmap\.org/);
    assert.match(html, /href="\/logo\.svg"/);
    assert.match(html, /maple-mono-latin-700-italic-D7QxTey4\.woff2/);
    assert.match(html, /data-fingerprint=""/);
    assert.match(html, /:text="data\.fingerprint/);
    assert.match(html, /IP 纯净度/);
    assert.match(html, /hx-get="\/purity"/);
    assert.match(html, /data-privacy-toggle/);
    assert.match(html, /data-private/);
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

    const hostname = await fetch(`${origin}/hostname`);
    assert.equal(hostname.status, 200);
    assert.equal(hostname.headers.get('cache-control'), 'no-store');
    assert.equal(await hostname.text(), '');

    const purity = await fetch(`${origin}/api/purity`, {
      headers: { 'CF-Connecting-IP': '216.40.85.151' }
    }).then(response => response.json());
    assert.equal(purity.riskScore, 46);
    assert.equal(purity.level, '轻度风险');
    assert.equal(purity.networkType, '机房 / 云服务');
    assert.equal(purity.ipSource, '广播IP');
    assert.equal(purity.ipAttribute, '机房IP');
    assert.equal(purity.humanTraffic, 52.54);
    assert.equal(purity.botTraffic, 47.46);
    assert.equal(purity.trafficSource, 'Cloudflare Radar');
    assert.equal(purity.trafficScope, 'AS1054 · 最近7天');

    const purityFragment = await fetch(`${origin}/purity`, {
      headers: { 'CF-Connecting-IP': '216.40.85.151' }
    }).then(response => response.text());
    assert.match(purityFragment, /风险系数/);
    assert.match(purityFragment, /轻度风险/);
    assert.match(purityFragment, /纯净度/);
    assert.match(purityFragment, /ASN 人机流量比/);
    assert.match(purityFragment, /Cloudflare Radar/);
    assert.match(purityFragment, /human 52\.54%/);
    assert.match(purityFragment, /bot 47\.46%/);
    assert.match(purityFragment, /IP来源/);
    assert.match(purityFragment, /IP属性/);
    assert.match(purityFragment, /广播IP/);
    assert.match(purityFragment, /机房IP/);
    assert.match(purityFragment, /ip-classification-badge/);
    assert.match(purityFragment, /ip-classification-badge--yellow/);
    assert.match(purityFragment, /ip-classification-badge--orange/);
  });
});

test('non-browser user agents are rendered as Bot like the source site', async () => {
  await withServer(async origin => {
    const response = await fetch(origin, {
      headers: {
        'CF-Connecting-IP': '216.40.85.151',
        Accept: 'text/html',
        'User-Agent': 'curl/8.16.0'
      }
    });
    const html = await response.text();
    assert.match(html, />设备<\/dt><dd[^>]*>Bot<\/dd>/);
    assert.doesNotMatch(html, />浏览器<\/dt>/);
    assert.doesNotMatch(html, />操作系统<\/dt>/);
  });
});

test('IP classification badges use the requested semantic colors', () => {
  const base = {
    levelKey: 'clean', riskScore: 0, purityScore: 100, humanTraffic: 100, botTraffic: 0,
    level: '纯净', summary: '测试', networkType: '测试', confidence: '高', hostname: '', factors: []
  };
  const cases = [
    ['原生IP', 'green'], ['住宅IP', 'green'],
    ['广播IP', 'yellow'], ['商业宽带', 'yellow'],
    ['机房IP', 'orange'], ['匿名代理', 'red'], ['未知', 'gray']
  ];

  for (const [label, tone] of cases) {
    const html = renderPurityPanel({ ...base, ipSource: label, ipAttribute: label });
    assert.match(html, new RegExp(`ip-classification-badge--${tone}[^>]*>${label}<`));
  }
});
