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

function row(label, value, html = false) {
  return `<div class="flex items-baseline justify-between gap-6"><dt class="shrink-0 text-sm text-pink-900/75">${escapeHtml(label)}</dt><dd dir="auto" class="min-w-0 text-balance break-words text-end font-mono text-sm">${html ? value : escapeHtml(value || '未知')}</dd></div>`;
}

function tab(iconClass, title, extra = '') {
  return `<div class="flex items-center justify-between gap-3"><h2 class="flex items-center gap-1.5 rounded-xl border-2 border-black bg-pink-300 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest shadow-tab"><span class="iconify size-4 ${iconClass}" aria-hidden="true"></span> ${escapeHtml(title)}</h2>${extra}</div>`;
}

export function renderPage({ ip, geo, client }) {
  const countryText = `${countryFlag(geo.countryCode)} ${geo.country}`.trim();
  const mapValue = geo.latitude !== undefined && geo.longitude !== undefined
    ? `<a class="underline decoration-pink-400 underline-offset-2" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(geo.latitude)},${encodeURIComponent(geo.longitude)}" target="_blank" rel="noopener" title="${escapeHtml(geo.latitude)}, ${escapeHtml(geo.longitude)} ± ${escapeHtml(geo.accuracyRadius || '?')} km">${escapeHtml(geo.city)}</a>`
    : escapeHtml(geo.city);
  const asn = geo.asn ? `AS${geo.asn}${geo.asnName ? ` ${geo.asnName}` : ''}` : '未知';

  return `<!doctype html><html lang="zh-Hans" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="可爱的 IP 地址查询工具。"><title>我是谁？</title><link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="preload" as="font" type="font/woff2" href="/assets/TwemojiCountryFlags-Bymva2JV.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/maple-mono-latin-400-normal-WIx2rg0p.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/maple-mono-latin-700-normal-B_sC0Ion.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/open-runde-latin-400-normal-Crq_kbPk.woff2" crossorigin="anonymous"><link rel="preload" as="font" type="font/woff2" href="/assets/open-runde-latin-700-normal-BeFL_mDB.woff2" crossorigin="anonymous"><link rel="stylesheet" href="${browserAssets.css}"><script type="module" src="${browserAssets.client}"></script></head><body class="min-h-dvh bg-pink-100 font-sans text-pink-950 antialiased"><main class="mx-auto flex min-h-dvh w-fit min-w-[min(36rem,100%)] max-w-full flex-col justify-center px-4 py-8"><div class="relative -mb-3 flex flex-wrap items-center justify-between gap-2 px-6 sm:px-8"><h1 class="flex items-center gap-1.5 rounded-xl border-2 border-black bg-pink-300 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest shadow-tab"><span class="size-4 bg-current mask-[url(/icon.svg)] mask-contain mask-center mask-no-repeat" aria-hidden="true"></span> 我是谁？</h1></div><article class="rounded-2xl border-2 border-black bg-white shadow-cap"><header class="px-6 pb-7 pt-10 sm:px-8"><p dir="ltr" class="break-words text-center font-mono text-3xl font-bold tracking-tight sm:text-4xl">${escapeHtml(ip)}</p></header><section class="@container border-t-2 border-dashed border-pink-200 px-6 py-6 sm:px-8">${tab('mingcute--location-line', '位置', '<div class="translate-y-0.5"><a class="text-xs text-pink-900/75 hover:underline" href="https://www.maxmind.com" target="_blank" rel="noopener">MaxMind</a></div>')}<dl class="mt-5 space-y-2.5">${row('城市', mapValue, true)}${row('邮政编码', geo.postalCode)}${row('地区', geo.region)}${row('国家', countryText)}${row('时区', `<span class="cursor-help underline decoration-pink-400 decoration-dashed underline-offset-2" title="${escapeHtml(geo.timezone)}">${escapeHtml(geo.timezone)}</span>`, true)}${row('网络', geo.network)}${row('ASN', asn)}${row('服务商', geo.provider)}</dl></section><section class="@container border-t-2 border-dashed border-pink-200 px-6 py-6 sm:px-8">${tab('mingcute--send-plane-line', '请求')}<dl class="mt-5 space-y-2.5">${row('浏览器', client.browser)}${row('操作系统', client.os)}${row('设备', client.device)}</dl></section><section class="@container border-t-2 border-dashed border-pink-200 px-6 py-6 sm:px-8" data-fingerprint="" data-timezone="" id="browser">${tab('mingcute--web-line', '浏览器')}<dl class="mt-5 space-y-2.5">${row('指纹', '<span data-fingerprint-spinner class="inline-block h-3.5 rounded-full bg-pink-100 align-middle motion-safe:animate-pulse w-[8ch] sm:w-[32ch]" aria-hidden="true" :hidden="!!data.fingerprint"></span> <span data-fingerprint-short class="sm:hidden" :text="data.fingerprint?.slice(0, 8)"></span> <span data-fingerprint-full class="hidden sm:inline" :text="data.fingerprint"></span>', true)}${row('时区', '<span data-timezone-spinner class="inline-block h-3.5 rounded-full bg-pink-100 align-middle motion-safe:animate-pulse w-[13ch]" aria-hidden="true" :hidden="!!data.timezone"></span> <span data-timezone-value class="cursor-help underline decoration-pink-400 decoration-dashed underline-offset-2" :text="data.timezone" :title="data.timezone"></span>', true)}</dl></section><footer class="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1 border-t-2 border-dashed border-pink-200 px-6 py-6 text-center text-pink-900/75 sm:justify-between sm:px-8 sm:text-start"><p class="font-mono text-xs"><span aria-hidden="true" class="select-none">$ </span><span class="select-all">curl whoami.moe</span></p><p class="text-xs">你的 IP 地址不会被保存。</p></footer></article></main></body></html>`;
}
