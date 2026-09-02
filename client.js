import FingerprintJS from '@fingerprintjs/fingerprintjs';
import htmx from 'htmx.org';
import 'htmx.org/dist/ext/hx-live.js';

globalThis.htmx = htmx;

const { q } = htmx.live;
const browserSection = document.querySelector('#browser');
const zoneTime = timezone => timezone
  ? new Intl.DateTimeFormat(document.documentElement.lang, { timeStyle: 'short', timeZone: timezone }).format()
  : null;

htmx.registerExtension('zone-time', {
  htmx_scope: (_element, context) => {
    context.scope.zoneTime = zoneTime;
  }
});

function paintBrowserValues() {
  const fingerprint = browserSection?.dataset.fingerprint || '';
  const timezone = browserSection?.dataset.timezone || '';
  const fingerprintSpinner = browserSection?.querySelector('[data-fingerprint-spinner]');
  const timezoneSpinner = browserSection?.querySelector('[data-timezone-spinner]');
  const shortNode = browserSection?.querySelector('[data-fingerprint-short]');
  const fullNode = browserSection?.querySelector('[data-fingerprint-full]');
  const timezoneNode = browserSection?.querySelector('[data-timezone-value]');
  if (fingerprintSpinner) fingerprintSpinner.hidden = Boolean(fingerprint);
  if (timezoneSpinner) timezoneSpinner.hidden = Boolean(timezone);
  if (shortNode) shortNode.textContent = fingerprint.slice(0, 8);
  if (fullNode) fullNode.textContent = fingerprint;
  if (timezoneNode) {
    timezoneNode.textContent = timezone;
    timezoneNode.title = timezone;
  }
}

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
q('#browser').data.timezone = timezone;

try {
  const agent = await FingerprintJS.load({ monitoring: false });
  const result = await agent.get();
  q('#browser').data.fingerprint = result.visitorId;
} catch {
  q('#browser').data.fingerprint = 'unavailable';
}

const hydrateBindings = () => {
  htmx.process(document.body);
  htmx.live.refresh();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrateBindings, { once: true });
} else {
  hydrateBindings();
}

paintBrowserValues();
