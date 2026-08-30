const COUNTRY_NAMES = {
  CN: '中国', HK: '中国香港', MO: '中国澳门', TW: '中国台湾',
  US: '美国', JP: '日本', SG: '新加坡', KR: '韩国', GB: '英国',
  DE: '德国', FR: '法国', CA: '加拿大', AU: '澳大利亚', RU: '俄罗斯',
  NL: '荷兰', IN: '印度', BR: '巴西'
};

const REGION_NAMES = {
  California: '加州', 'New York': '纽约州', Texas: '得克萨斯州',
  Washington: '华盛顿州', Illinois: '伊利诺伊州'
};

const CITY_NAMES = {
  'Los Angeles': '洛杉矶', 'San Francisco': '旧金山', 'New York': '纽约',
  Tokyo: '东京', Singapore: '新加坡', London: '伦敦', Paris: '巴黎',
  Frankfurt: '法兰克福', Amsterdam: '阿姆斯特丹', 'Hong Kong': '香港',
  Shanghai: '上海', Beijing: '北京', Shenzhen: '深圳'
};

const ASSETS = __ASSET_TABLE__;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
}

function networkOf(ip) {
  if (!ip) return '未知';
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 3).join(':')}::/48`;
  }
  const parts = ip.split('.');
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0/24` : ip;
}

function detectClient(ua = '') {
  let browser = 'Unknown';
  const chromium = ua.match(/(?:Chrome|CriOS)\/(\d+)/);
  const edge = ua.match(/Edg(?:A|iOS)?\/(\d+)/);
  const firefox = ua.match(/Firefox\/(\d+)/);
  const safari = ua.match(/Version\/(\d+).+Safari/);
  if (edge) browser = `Edge ${edge[1]}`;
  else if (chromium) browser = `Chrome ${chromium[1]}`;
  else if (firefox) browser = `Firefox ${firefox[1]}`;
  else if (safari) browser = `Safari ${safari[1]}`;

  let os = 'Unknown';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  const device = /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? 'Mobile' : 'Desktop';
  return { browser, os, device };
}

function row(label, value, html = false) {
  return `<div class="flex items-baseline justify-between gap-6"><dt class="shrink-0 text-sm text-pink-900/75">${escapeHtml(label)}</dt><dd dir="auto" class="min-w-0 text-balance break-words text-end font-mono text-sm">${html ? value : escapeHtml(value || '未知')}</dd></div>`;
}

function tab(iconClass, title, extra = '') {
  return `<div class="flex items-center justify-between gap-3"><h2 class="flex items-center gap-1.5 rounded-xl border-2 border-black bg-pink-300 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest shadow-tab"><span class="iconify size-4 ${iconClass}" aria-hidden="true"></span> ${escapeHtml(title)}</h2>${extra}</div>`;
}

function htmlPage(request, ip) {
  const cf = request.cf || {};
  const client = detectClient(request.headers.get('User-Agent') || '');
  const country = cf.country || '';
  const cityRaw = cf.city || '';
  const regionRaw = cf.region || '';
  const city = CITY_NAMES[cityRaw] || cityRaw || '未知';
  const region = REGION_NAMES[regionRaw] || regionRaw || '未知';
  const countryText = `${countryFlag(country)} ${COUNTRY_NAMES[country] || country || '未知'}`.trim();
  const latitude = cf.latitude || '';
  const longitude = cf.longitude || '';
  const mapValue = latitude && longitude
    ? `<a class="underline decoration-pink-400 underline-offset-2" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}" target="_blank" rel="noopener" title="${escapeHtml(latitude)}, ${escapeHtml(longitude)}">${escapeHtml(city)}</a>`
    : escapeHtml(city);
  const asn = cf.asn ? `AS${cf.asn}${cf.asOrganization ? ` ${cf.asOrganization}` : ''}` : '未知';
  const provider = cf.asOrganization || '未知';
  const timezone = cf.timezone || '未知';
  const postalCode = cf.postalCode || '未知';

  return `<!doctype html><html lang="zh-Hans" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="可爱的 IP 地址查询工具。"><title>我是谁？</title><link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="preload" as="font" type="font/woff2" href="/assets/flags.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/maple-400.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/maple-700.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/runde-400.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/runde-700.woff2" crossorigin="anonymous"><link rel="stylesheet" href="/assets/main.css"><script type="module" src="/assets/client.js"></script></head><body class="min-h-dvh bg-pink-100 font-sans text-pink-950 antialiased"><main class="mx-auto flex min-h-dvh w-fit min-w-[min(36rem,100%)] max-w-full flex-col justify-center px-4 py-8"><div class="relative -mb-3 flex flex-wrap items-center justify-between gap-2 px-6 sm:px-8"><h1 class="flex items-center gap-1.5 rounded-xl border-2 border-black bg-pink-300 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest shadow-tab"><span class="size-4 bg-current mask-[url(/icon.svg)] mask-contain mask-center mask-no-repeat" aria-hidden="true"></span> 我是谁？</h1></div><article class="rounded-2xl border-2 border-black bg-white shadow-cap"><header class="px-6 pb-7 pt-10 sm:px-8"><p dir="ltr" class="break-words text-center font-mono text-3xl font-bold tracking-tight sm:text-4xl">${escapeHtml(ip)}</p></header><section class="@container border-t-2 border-dashed border-pink-200 px-6 py-6 sm:px-8">${tab('mingcute--location-line', '位置', '<div class="translate-y-0.5"><span class="text-xs text-pink-900/75">Cloudflare</span></div>')}<dl class="mt-5 space-y-2.5">${row('城市', mapValue, true)}${row('邮政编码', postalCode)}${row('地区', region)}${row('国家', countryText)}${row('时区', `<span class="cursor-help underline decoration-pink-400 decoration-dashed underline-offset-2" title="${escapeHtml(timezone)}">${escapeHtml(timezone)}</span>`, true)}${row('网络', networkOf(ip))}${row('ASN', asn)}${row('服务商', provider)}</dl></section><section class="@container border-t-2 border-dashed border-pink-200 px-6 py-6 sm:px-8">${tab('mingcute--send-plane-line', '请求')}<dl class="mt-5 space-y-2.5">${row('浏览器', client.browser)}${row('操作系统', client.os)}${row('设备', client.device)}</dl></section><section class="@container border-t-2 border-dashed border-pink-200 px-6 py-6 sm:px-8" id="browser">${tab('mingcute--web-line', '浏览器')}<dl class="mt-5 space-y-2.5">${row('指纹', '<span id="fp-short" class="sm:hidden"><span class="inline-block h-3.5 rounded-full bg-pink-100 align-middle motion-safe:animate-pulse w-[8ch]" aria-hidden="true"></span></span><span id="fp-full" class="hidden sm:inline"><span class="inline-block h-3.5 rounded-full bg-pink-100 align-middle motion-safe:animate-pulse sm:w-[32ch]" aria-hidden="true"></span></span>', true)}${row('时区', '<span id="browser-timezone" class="inline-block h-3.5 rounded-full bg-pink-100 align-middle motion-safe:animate-pulse w-[13ch]"></span>', true)}</dl></section><footer class="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1 border-t-2 border-dashed border-pink-200 px-6 py-6 text-center text-pink-900/75 sm:justify-between sm:px-8 sm:text-start"><p class="font-mono text-xs"><span aria-hidden="true" class="select-none">$ </span><span class="select-all">curl ${escapeHtml(new URL(request.url).host)}</span></p><p class="text-xs">你的 IP 地址不会被保存。</p></footer></article></main></body></html>`;
}

function assetResponse(asset) {
  const body = asset.base64
    ? Uint8Array.from(atob(asset.body), c => c.charCodeAt(0))
    : asset.body;
  return new Response(body, {
    headers: {
      'content-type': asset.type,
      'cache-control': 'public, max-age=31536000, immutable',
      'access-control-allow-origin': '*'
    }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (ASSETS[url.pathname]) return assetResponse(ASSETS[url.pathname]);

    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Real-IP')
      || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
      || '127.0.0.1';

    if (url.pathname === '/api/info') {
      return Response.json({ ip, cf: request.cf || {}, ...detectClient(request.headers.get('User-Agent') || '') }, {
        headers: { 'cache-control': 'no-store' }
      });
    }

    if (url.pathname !== '/') return new Response('Not Found', { status: 404 });

    const acceptsHtml = (request.headers.get('Accept') || '').includes('text/html');
    if (!acceptsHtml) {
      return new Response(`${ip}\n`, {
        headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'no-store' }
      });
    }

    return new Response(htmlPage(request, ip), {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'no-store',
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
        'referrer-policy': 'no-referrer',
        'x-content-type-options': 'nosniff'
      }
    });
  }
};
