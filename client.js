import FingerprintJS from '/assets/fingerprint.js';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
const timezoneNode = document.querySelector('#browser-timezone');
if (timezoneNode) {
  timezoneNode.className = 'cursor-help underline decoration-pink-400 decoration-dashed underline-offset-2';
  timezoneNode.textContent = timezone;
  timezoneNode.title = timezone;
}

try {
  const agent = await FingerprintJS.load({ monitoring: false });
  const result = await agent.get();
  const shortNode = document.querySelector('#fp-short');
  const fullNode = document.querySelector('#fp-full');
  if (shortNode) shortNode.textContent = result.visitorId.slice(0, 8);
  if (fullNode) fullNode.textContent = result.visitorId;
} catch {
  const shortNode = document.querySelector('#fp-short');
  const fullNode = document.querySelector('#fp-full');
  if (shortNode) shortNode.textContent = 'unavailable';
  if (fullNode) fullNode.textContent = 'unavailable';
}
