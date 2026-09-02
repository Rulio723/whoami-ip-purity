import dns from 'node:dns/promises';
import net from 'node:net';

export async function lookupHostname(ip, { reverse = dns.reverse, timeoutMs = 1500 } = {}) {
  if (!net.isIP(ip)) return '';

  let timer;
  try {
    const names = await Promise.race([
      reverse(ip),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('reverse DNS timeout')), timeoutMs);
      })
    ]);
    return String(names?.[0] || '').replace(/\.$/, '');
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}
