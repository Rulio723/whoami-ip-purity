import { browserAssets } from './assets.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(...code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0)));
}

function row(label, value, html = false, privateValue = false) {
  return `<div class="flex items-baseline justify-between gap-6"><dt class="shrink-0 text-sm text-pink-900/75">${escapeHtml(label)}</dt><dd dir="auto" class="min-w-0 text-balance break-words text-end font-mono text-sm"${privateValue ? ' data-private' : ''}>${html ? value : escapeHtml(value || '未知')}</dd></div>`;
}

function badge(value) {
  const label = value || '未知';
  const tone = {
    原生IP: 'green',
    住宅IP: 'green',
    广播IP: 'yellow',
    商业宽带: 'yellow',
    机房IP: 'orange',
    匿名代理: 'red',
    未知: 'gray'
  }[label] || 'gray';
  return `<span class="ip-classification-badge ip-classification-badge--${tone}">${escapeHtml(label)}</span>`;
}

function tab(iconClass, title, extra = '') {
  return `<div class="flex items-center justify-between gap-3"><h2 class="flex items-center gap-1.5 rounded-xl border-2 border-black bg-pink-300 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest shadow-tab"><span class="iconify size-4 ${iconClass}" aria-hidden="true"></span> ${escapeHtml(title)}</h2>${extra}</div>`;
}

function renderTrafficMix(purity) {
  if (!purity.trafficAvailable || !Number.isFinite(purity.humanTraffic) || !Number.isFinite(purity.botTraffic)) {
    return `<div class="traffic-mix"><div class="traffic-mix-title"><span>ASN 人机流量比</span><small>${escapeHtml(purity.trafficSource || 'Cloudflare Radar')} · 最近7天</small></div><p class="traffic-unavailable">暂无该 ASN 的 Cloudflare Radar 人机流量数据</p></div>`;
  }

  const human = purity.humanTraffic.toFixed(2);
  const bot = purity.botTraffic.toFixed(2);
  return `<div class="traffic-mix"><div class="traffic-mix-title"><span>ASN 人机流量比</span><small>${escapeHtml(purity.trafficSource)} · ${escapeHtml(purity.trafficScope)}</small></div><progress class="traffic-progress" max="100" value="${escapeHtml(purity.humanTraffic)}" aria-label="Cloudflare Radar 统计：人类流量 ${escapeHtml(human)}%，机器人流量 ${escapeHtml(bot)}%"></progress><div class="traffic-legend"><span>human ${escapeHtml(human)}%</span><span>bot ${escapeHtml(bot)}%</span></div></div>`;
}

export function renderPurityPanel(purity) {
  const factorRows = purity.factors
    .filter(item => item.weight !== 0)
    .map(item => row(item.label, `${item.value}${item.weight > 0 ? ` (+${item.weight})` : ` (${item.weight})`}`))
    .join('');

  return `<div class="purity-result purity-${escapeHtml(purity.levelKey)}"><div class="purity-heading"><div><p class="purity-score"><strong>${escapeHtml(purity.riskScore)}</strong><span>/100</span></p><p class="purity-caption">风险系数</p></div><div class="purity-verdict"><strong>${escapeHtml(purity.level)}</strong><span>${escapeHtml(purity.summary)}</span></div></div><progress class="purity-progress" max="100" value="${escapeHtml(purity.riskScore)}" aria-label="IP 风险系数 ${escapeHtml(purity.riskScore)} 分"></progress><div class="purity-scale" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>70</span><span>100</span></div>${renderTrafficMix(purity)}<dl class="mt-5 space-y-2.5">${row('IP来源', badge(purity.ipSource), true)}${row('IP属性', badge(purity.ipAttribute), true)}${row('纯净度', `${purity.purityScore}%`)}${row('网络属性', purity.networkType)}${row('判断置信度', purity.confidence)}${row('PTR', purity.hostname || '无记录', false, true)}${factorRows}</dl><p class="purity-note">纯净度是当前 IP 的启发式评分；人机流量比是 Cloudflare Radar 对该 ASN 近 7 天 HTML 请求的独立统计。两者含义不同，不应相等。应用不会保存你的 IP。</p></div>`;
}

export function renderPage({ ip, geo, client }) {
  const countryText = `${countryFlag(geo.countryCode)} ${geo.country}`.trim();
  const mapValue = geo.latitude !== undefined && geo.longitude !== undefined
    ? `<a class="underline decoration-pink-400 underline-offset-2" href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(geo.latitude)}&amp;mlon=${encodeURIComponent(geo.longitude)}#map=11/${encodeURIComponent(geo.latitude)}/${encodeURIComponent(geo.longitude)}" target="_blank" title="${escapeHtml(geo.latitude)}, ${escapeHtml(geo.longitude)} ± ${escapeHtml(geo.accuracyRadius || '?')} km">${escapeHtml(geo.city)}</a>`
    : escapeHtml(geo.city);
  const asn = geo.asn ? `AS${geo.asn}${geo.asnName ? ` ${geo.asnName}` : ''}` : '未知';
  const requestRows = client.device === 'Bot'
    ? row('设备', 'Bot', false, true)
    : `${row('浏览器', client.browser, false, true)}${row('操作系统', client.os, false, true)}${row('设备', client.device, false, true)}`;

  return `<!doctype html><html lang="zh-Hans" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>我是谁？</title><link rel="preload" as="font" type="font/woff2" href="/assets/TwemojiCountryFlags-Bymva2JV.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/maple-mono-latin-400-normal-WIx2rg0p.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/maple-mono-latin-700-italic-D7QxTey4.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/maple-mono-latin-700-normal-B_sC0Ion.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/open-runde-latin-400-normal-Crq_kbPk.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/open-runde-latin-700-normal-BeFL_mDB.woff2" crossorigin="anonymous"><link rel="stylesheet" href="${browserAssets.css}"><script type="module" src="${browserAssets.client}"></script><link rel="modulepreload" href="${browserAssets.client}"><link rel="dns-prefetch" href="https://track.ecchi.cx"><meta name="description" content="可爱的 IP 地址、纯净度与浏览器指纹检测工具。"><meta name="color-scheme" content="light"><meta name="theme-color" content="#fda5d5"><meta property="og:type" content="website"><meta property="og:url" content="https://ip.rulio.sryze.cc/"><meta property="og:title" content="Who am I?"><meta property="og:description" content="A cute IP address lookup."><meta property="og:image" content="https://ip.rulio.sryze.cc/og.png?v=047a2f6"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/logo.svg" type="image/svg+xml"><noscript><style>[data-pending]{display:none}</style></noscript></head><body class="min-h-dvh bg-pink-100 font-sans text-pink-950"><main class="mx-auto flex min-h-dvh w-fit min-w-[min(36rem,100%)] max-w-full flex-col justify-center px-4 py-8"><div class="relative -mb-3 flex flex-wrap items-center justify-between gap-2 px-6 sm:px-8"><h1 class="flex items-center gap-1.5 rounded-xl border-2 border-black bg-pink-300 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest shadow-tab"><span class="size-4 bg-current mask-[url(/logo.svg)] mask-contain mask-center mask-no-repeat" aria-hidden="true"></span> 我是谁？</h1><button class="privacy-toggle" type="button" data-privacy-toggle aria-pressed="false"><span aria-hidden="true">◉</span><span data-privacy-label>隐藏隐私</span></button></div><article class="rounded-2xl border-2 border-black bg-white shadow-cap"><header class="flex flex-col gap-4 px-6 pb-7 pt-10 sm:px-8"><p dir="ltr" role="group" aria-label="IPv4" class="break-words text-center font-mono font-bold tracking-tight text-3xl sm:text-4xl" data-private>${escapeHtml(ip)}</p><p dir="ltr" class="@container break-words text-center font-mono text-sm font-bold text-pink-900/75 empty:hidden" data-private data-pending="" hx-get="/hostname" hx-swap="textContent" hx-trigger="load"><span class="inline-block h-[1em] rounded-full bg-pink-100 align-middle motion-safe:animate-pulse w-[24ch]" aria-hidden="true"></span></p></header><section class="@container border-t-2 border-dashed border-pink-200 px-6 py-6 sm:px-8">${tab('mingcute--location-line', '位置', '<div class="translate-y-0.5"><a class="text-xs text-pink-900/75 hover:underline" href="https://www.maxmind.com" target="_blank">MaxMind</a></div>')}<dl class="mt-5 space-y-2.5">${row('城市', mapValue, true, true)}${row('邮政编码', geo.postalCode, false, true)}${row('地区', geo.region, false, true)}${row('国家', countryText, false, true)}${row('时区', `<span class="cursor-help underline decoration-pink-400 decoration-dashed underline-offset-2" hx-on:mouseenter="attr.title = zoneTime(data.timezone)" data-timezone="${escapeHtml(geo.timezone)}">${escapeHtml(geo.timezone)}</span>`, true, true)}${row('网络', geo.network, false, true)}${row('ASN', asn, false, true)}${row('服务商', geo.provider, false, true)}</dl></section><section class="@container border-t-2 border-dashed border-pink-200 px-6 py-6 sm:px-8">${tab('mingcute--send-plane-line', '请求')}<dl class="mt-5 space-y-2.5">${requestRows}</dl></section><section class="@container border-t-2 border-dashed border-pink-200 px-6 py-6 sm:px-8">${tab('mingcute--shield-check-line', 'IP 纯净度')}<div class="mt-5" id="purity" data-pending="" hx-get="/purity" hx-trigger="load" hx-swap="innerHTML"><div class="purity-loading"><span class="inline-block h-[1em] rounded-full bg-pink-100 align-middle motion-safe:animate-pulse w-[24ch]" aria-hidden="true"></span><span>正在综合 ASN 与反向 DNS 信号…</span></div></div></section><section class="@container border-t-2 border-dashed border-pink-200 px-6 py-6 sm:px-8" data-fingerprint="" data-pending="" data-timezone="" id="browser">${tab('mingcute--web-line', '浏览器')}<dl class="mt-5 space-y-2.5">${row('指纹', '<span data-fingerprint-spinner class="inline-block h-[1em] rounded-full bg-pink-100 align-middle motion-safe:animate-pulse w-[8ch] sm:w-[32ch]" aria-hidden="true" :hidden="!!data.fingerprint"></span> <span data-fingerprint-short class="sm:hidden" :text="data.fingerprint?.slice(0, 8)"></span> <span data-fingerprint-full class="hidden sm:inline" :text="data.fingerprint"></span>', true, true)}${row('时区', '<span data-timezone-spinner class="inline-block h-[1em] rounded-full bg-pink-100 align-middle motion-safe:animate-pulse w-[13ch]" aria-hidden="true" :hidden="!!data.timezone"></span> <span data-timezone-value class="cursor-help underline decoration-pink-400 decoration-dashed underline-offset-2" hx-on:mouseenter="attr.title = zoneTime(data.timezone)" :text="data.timezone"></span>', true, true)}</dl></section><footer class="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1 border-t-2 border-dashed border-pink-200 px-6 py-6 text-center text-pink-900/75 sm:justify-between sm:px-8 sm:text-start"><p class="font-mono text-xs"><span aria-hidden="true" class="select-none">$ </span><span class="select-all">curl ip.rulio.sryze.cc</span></p><p class="text-xs">你的 IP 地址不会被保存。</p></footer></article></main></body></html>`;
}
