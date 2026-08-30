import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { x as extract } from 'tar';

const accountId = process.env.MAXMIND_ACCOUNT_ID;
const licenseKey = process.env.MAXMIND_LICENSE_KEY;
const outputDir = path.resolve(process.env.MAXMIND_DB_DIR || 'databases');

if (!accountId || !licenseKey) {
  throw new Error('Set MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY before running npm run maxmind:update');
}

fs.mkdirSync(outputDir, { recursive: true });

for (const edition of ['GeoLite2-City', 'GeoLite2-ASN']) {
  const url = `https://download.maxmind.com/geoip/databases/${edition}/download?suffix=tar.gz`;
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${Buffer.from(`${accountId}:${licenseKey}`).toString('base64')}` }
  });
  if (!response.ok || !response.body) throw new Error(`${edition} download failed: HTTP ${response.status}`);

  const archive = path.join(os.tmpdir(), `${edition}-${Date.now()}.tar.gz`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(archive));
  await extract({
    file: archive,
    cwd: outputDir,
    strip: 1,
    filter: entry => entry.endsWith(`${edition}.mmdb`)
  });
  fs.rmSync(archive, { force: true });
  console.log(`updated ${path.join(outputDir, `${edition}.mmdb`)}`);
}
