import net from 'node:net';

function normalize(value = '') {
  let ip = String(value).trim();
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  if (ip.startsWith('[') && ip.includes(']')) ip = ip.slice(1, ip.indexOf(']'));
  return net.isIP(ip) ? ip : '';
}

export function getClientIp(request, { trustCloudflare = true } = {}) {
  if (trustCloudflare) {
    const cloudflareIp = normalize(request.get('CF-Connecting-IP'));
    if (cloudflareIp) return cloudflareIp;
  }

  const realIp = normalize(request.get('X-Real-IP'));
  if (realIp) return realIp;

  const forwarded = request.get('X-Forwarded-For')?.split(',')[0];
  const forwardedIp = normalize(forwarded);
  if (forwardedIp) return forwardedIp;

  return normalize(request.socket?.remoteAddress) || '127.0.0.1';
}

export function detectClient(userAgent = '') {
  if (!/Mozilla\/5\.0/i.test(userAgent)) {
    return { browser: '', os: '', device: 'Bot' };
  }

  let browser = 'Unknown';
  const chromium = userAgent.match(/(?:Chrome|CriOS)\/(\d+)/);
  const edge = userAgent.match(/Edg(?:A|iOS)?\/(\d+)/);
  const firefox = userAgent.match(/Firefox\/(\d+)/);
  const safari = userAgent.match(/Version\/(\d+).+Safari/);
  if (edge) browser = `Edge ${edge[1]}`;
  else if (chromium) browser = `Chrome ${chromium[1]}`;
  else if (firefox) browser = `Firefox ${firefox[1]}`;
  else if (safari) browser = `Safari ${safari[1]}`;

  let os = 'Unknown';
  if (/Windows NT/i.test(userAgent)) os = 'Windows';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';
  else if (/Mac OS X/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';

  const device = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent) ? 'Mobile' : 'Desktop';
  return { browser, os, device };
}
