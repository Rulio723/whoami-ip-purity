import net from 'node:net';

const HOSTING_ASNS = new Set([
  1054, 13335, 14618, 15169, 16276, 16509, 20473, 24940, 31898, 37963,
  45090, 45102, 63949, 8075, 14061
]);

const HOSTING_PATTERN = /\b(?:aws|amazon|azure|cloud|colo|datacenter|data center|digitalocean|google|hetzner|hosting|host|linode|microsoft|oracle|ovh|server|tencent|vps|vultr)\b/i;
const RESIDENTIAL_PATTERN = /\b(?:broadband|cable|communications|fiber|fibre|mobile|residential|telecom|telefonica|telstra|unicom|verizon|comcast|charter|cmcc)\b/i;
const ANONYMIZER_PATTERN = /\b(?:anonymous|anonymizer|exit node|proxy|tor|vpn)\b/i;
const PTR_HOSTING_PATTERN = /(?:^|[.\-_])(?:cloud|colo|host|server|static|vps)(?:[.\-_]|$)/i;
const PTR_RESIDENTIAL_PATTERN = /(?:^|[.\-_])(?:broadband|cable|dhcp|dsl|dynamic|mobile|pool|pppoe|res)(?:[.\-_]|$)/i;

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function classify(score) {
  if (score <= 15) return { key: 'clean', label: '纯净', summary: '未发现明显风险特征' };
  if (score <= 25) return { key: 'very-low', label: '极低风险', summary: '网络特征接近普通用户连接' };
  if (score <= 40) return { key: 'low', label: '低风险', summary: '存在少量需要留意的网络特征' };
  if (score <= 50) return { key: 'mild', label: '轻度风险', summary: '可能属于机房、云服务或共享出口' };
  if (score <= 70) return { key: 'medium', label: '中度风险', summary: '多个信号表明该地址并非普通住宅出口' };
  if (score <= 85) return { key: 'high', label: '高风险', summary: '该地址具有明显代理或匿名网络特征' };
  return { key: 'critical', label: '极高风险', summary: '该地址具有强匿名化或高风险基础设施特征' };
}

function factor(label, value, weight, detail) {
  return { label, value, weight, detail };
}

function describeIp(networkType) {
  if (networkType === '住宅 / 运营商') {
    return { ipSource: '原生IP', ipAttribute: '住宅IP' };
  }
  if (networkType === '机房 / 云服务') {
    return { ipSource: '广播IP', ipAttribute: '机房IP' };
  }
  if (networkType === '匿名代理') {
    return { ipSource: '广播IP', ipAttribute: '匿名代理' };
  }
  return { ipSource: '广播IP', ipAttribute: '商业宽带' };
}

export function analyzeIpPurity({ ip, geo = {}, hostname = '' } = {}) {
  if (!net.isIP(ip || '')) {
    return {
      ip: ip || '', riskScore: 100, purityScore: 0, level: '无法评估', levelKey: 'unknown',
      summary: 'IP 地址格式无效', networkType: '未知', confidence: '低', hostname: '',
      ipSource: '未知', ipAttribute: '未知', factors: []
    };
  }

  const provider = String(geo.provider || '');
  const normalizedHostname = String(hostname || '').replace(/\.$/, '').toLowerCase();
  const asn = Number(geo.asn) || null;
  const factors = [];
  let score = 7;
  let networkType = '普通网络';

  if (ANONYMIZER_PATTERN.test(provider) || ANONYMIZER_PATTERN.test(normalizedHostname)) {
    score += 58;
    networkType = '匿名代理';
    factors.push(factor('匿名网络', '命中', 58, 'ASN 或 PTR 名称包含 VPN、代理或 Tor 特征'));
  } else if (HOSTING_ASNS.has(asn) || HOSTING_PATTERN.test(provider)) {
    score += 35;
    networkType = '机房 / 云服务';
    factors.push(factor('网络类型', '机房 / 云服务', 35, 'ASN 属于已知托管网络或服务商名称具有托管特征'));
  } else if (RESIDENTIAL_PATTERN.test(provider)) {
    networkType = '住宅 / 运营商';
    factors.push(factor('网络类型', '住宅 / 运营商', -4, '服务商名称具有宽带或移动运营商特征'));
    score -= 4;
  } else {
    score += 8;
    networkType = '商业 / 未分类';
    factors.push(factor('网络类型', '未分类', 8, 'ASN 无法明确归类为住宅或托管网络'));
  }

  if (normalizedHostname) {
    if (!ANONYMIZER_PATTERN.test(normalizedHostname) && PTR_HOSTING_PATTERN.test(normalizedHostname)) {
      score += 12;
      factors.push(factor('PTR 主机名', '托管特征', 12, normalizedHostname));
    } else if (PTR_RESIDENTIAL_PATTERN.test(normalizedHostname)) {
      score -= 4;
      factors.push(factor('PTR 主机名', '动态接入特征', -4, normalizedHostname));
    } else {
      factors.push(factor('PTR 主机名', '已解析', 0, normalizedHostname));
    }
  } else {
    score += 4;
    factors.push(factor('PTR 主机名', '无记录', 4, '反向 DNS 未返回主机名'));
  }

  if (!asn) {
    score += 9;
    factors.push(factor('ASN', '无记录', 9, '无法确认网络自治系统'));
  } else {
    factors.push(factor('ASN', `AS${asn}`, 0, provider || '未知服务商'));
  }

  if (!geo.countryCode) {
    score += 5;
    factors.push(factor('地理信息', '不完整', 5, '缺少注册国家或地区信息'));
  }

  score = clamp(score);
  const classification = classify(score);
  const ipDescription = describeIp(networkType);
  const evidenceCount = [asn, provider, normalizedHostname, geo.countryCode].filter(Boolean).length;

  return {
    ip,
    riskScore: score,
    purityScore: 100 - score,
    level: classification.label,
    levelKey: classification.key,
    summary: classification.summary,
    networkType,
    ...ipDescription,
    confidence: evidenceCount >= 3 ? '高' : evidenceCount === 2 ? '中' : '低',
    hostname: normalizedHostname,
    factors
  };
}

export function createPurityService({ hostnameLookup, ttlMs = 10 * 60 * 1000, maxEntries = 1000 } = {}) {
  if (typeof hostnameLookup !== 'function') throw new Error('hostnameLookup is required');
  const cache = new Map();

  return {
    async lookup(ip, geo) {
      const now = Date.now();
      const cached = cache.get(ip);
      if (cached && cached.expiresAt > now) return cached.value;

      const pending = Promise.resolve(hostnameLookup(ip))
        .catch(() => '')
        .then(hostname => analyzeIpPurity({ ip, geo, hostname }));
      cache.set(ip, { expiresAt: now + ttlMs, value: pending });

      if (cache.size > maxEntries) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
      }
      return pending;
    }
  };
}
