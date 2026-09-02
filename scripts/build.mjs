import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { build } from 'vite';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const outputAssets = path.join(publicDir, 'assets');

fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(outputAssets, { recursive: true });

const copies = [
  ['assets/maple-400.woff2', 'assets/maple-mono-latin-400-normal-WIx2rg0p.woff2'],
  ['assets/maple-700-italic.woff2', 'assets/maple-mono-latin-700-italic-D7QxTey4.woff2'],
  ['assets/maple-700.woff2', 'assets/maple-mono-latin-700-normal-B_sC0Ion.woff2'],
  ['assets/runde-400.woff2', 'assets/open-runde-latin-400-normal-Crq_kbPk.woff2'],
  ['assets/runde-700.woff2', 'assets/open-runde-latin-700-normal-BeFL_mDB.woff2'],
  ['assets/flags.woff2', 'assets/TwemojiCountryFlags-Bymva2JV.woff2'],
  ['assets/logo.svg', 'logo.svg'],
  ['assets/og.png', 'og.png']
];

for (const [source, destination] of copies) {
  const output = path.join(publicDir, destination);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(path.join(root, source), output);
}

await build({ configFile: path.join(root, 'vite.config.js') });

const cssBody = fs.readFileSync(path.join(root, 'assets', 'main.css'));
const cssHash = crypto.createHash('sha256').update(cssBody).digest('hex').slice(0, 8);
const cssFile = `main-${cssHash}.css`;
fs.writeFileSync(path.join(outputAssets, cssFile), cssBody);

const clientFile = fs.readdirSync(outputAssets).find(file => /^client-[A-Za-z0-9_-]+\.js$/.test(file));
if (!clientFile) throw new Error('Vite did not emit a hashed client entry');
fs.writeFileSync(path.join(outputAssets, 'site-manifest.json'), JSON.stringify({
  client: `/assets/${clientFile}`,
  css: `/assets/${cssFile}`
}, null, 2));
console.log(`built browser assets in ${outputAssets}`);
