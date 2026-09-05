const RADAR_ENDPOINT = 'https://api.cloudflare.com/client/v4/radar/http/summary/BOT_CLASS';

function unavailable(reason, asn) {
  return {
    humanTraffic: null,
    botTraffic: null,
    trafficAvailable: false,
    trafficSource: 'Cloudflare Radar',
    trafficScope: asn ? `AS${asn} · 最近7天` : 'ASN · 最近7天',
    trafficUpdatedAt: null,
    trafficReason: reason
  };
}

export function createRadarService({
  apiToken = '',
  fetchImpl = globalThis.fetch,
  ttlMs = 15 * 60 * 1000,
  timeoutMs = 5000
} = {}) {
  const cache = new Map();

  return {
    async lookup(asn) {
      const normalizedAsn = Number(asn) || null;
      if (!normalizedAsn) return unavailable('缺少 ASN', normalizedAsn);
      if (!apiToken) return unavailable('未配置 Cloudflare Radar API Token', normalizedAsn);

      const now = Date.now();
      const cached = cache.get(normalizedAsn);
      if (cached && cached.expiresAt > now) return cached.value;

      const value = (async () => {
        try {
          const url = new URL(RADAR_ENDPOINT);
          url.searchParams.set('asn', String(normalizedAsn));
          url.searchParams.set('dateRange', '7d');
          url.searchParams.set('format', 'json');
          const response = await fetchImpl(url, {
            headers: { Authorization: `Bearer ${apiToken}` },
            signal: AbortSignal.timeout(timeoutMs)
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const payload = await response.json();
          const summary = payload?.result?.summary_0;
          const humanTraffic = Number(summary?.human);
          const botTraffic = Number(summary?.bot);
          if (!payload?.success || !Number.isFinite(humanTraffic) || !Number.isFinite(botTraffic)) {
            throw new Error('Radar 响应缺少人机流量数据');
          }

          return {
            humanTraffic,
            botTraffic,
            trafficAvailable: true,
            trafficSource: 'Cloudflare Radar',
            trafficScope: `AS${normalizedAsn} · 最近7天`,
            trafficUpdatedAt: payload.result.meta?.lastUpdated || null,
            trafficReason: ''
          };
        } catch (error) {
          return unavailable(error instanceof Error ? error.message : 'Radar 查询失败', normalizedAsn);
        }
      })();

      cache.set(normalizedAsn, { expiresAt: now + ttlMs, value });
      return value;
    }
  };
}
