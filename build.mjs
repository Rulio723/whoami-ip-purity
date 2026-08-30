import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'server'), { recursive: true });
fs.mkdirSync(path.join(out, '.openai'), { recursive: true });

const textAsset = (file, type) => ({ body: fs.readFileSync(file, 'utf8'), type, base64: false });
const binaryAsset = (file, type) => ({ body: fs.readFileSync(file).toString('base64'), type, base64: true });
const fingerprintPath = path.join(root, 'node_modules', '@fingerprintjs', 'fingerprintjs', 'dist', 'fp.esm.js');

const assets = {
  '/assets/main.css': textAsset(path.join(root, 'assets', 'main.css'), 'text/css; charset=UTF-8'),
  '/assets/client.js': textAsset(path.join(root, 'client.js'), 'text/javascript; charset=UTF-8'),
  '/assets/fingerprint.js': textAsset(fingerprintPath, 'text/javascript; charset=UTF-8'),
  '/assets/maple-400.woff2': binaryAsset(path.join(root, 'assets', 'maple-400.woff2'), 'font/woff2'),
  '/assets/maple-mono-latin-400-normal-WIx2rg0p.woff2': binaryAsset(path.join(root, 'assets', 'maple-400.woff2'), 'font/woff2'),
  '/assets/maple-700.woff2': binaryAsset(path.join(root, 'assets', 'maple-700.woff2'), 'font/woff2'),
  '/assets/maple-mono-latin-700-normal-B_sC0Ion.woff2': binaryAsset(path.join(root, 'assets', 'maple-700.woff2'), 'font/woff2'),
  '/assets/runde-400.woff2': binaryAsset(path.join(root, 'assets', 'runde-400.woff2'), 'font/woff2'),
  '/assets/open-runde-latin-400-normal-Crq_kbPk.woff2': binaryAsset(path.join(root, 'assets', 'runde-400.woff2'), 'font/woff2'),
  '/assets/runde-700.woff2': binaryAsset(path.join(root, 'assets', 'runde-700.woff2'), 'font/woff2'),
  '/assets/open-runde-latin-700-normal-BeFL_mDB.woff2': binaryAsset(path.join(root, 'assets', 'runde-700.woff2'), 'font/woff2'),
  '/assets/flags.woff2': binaryAsset(path.join(root, 'assets', 'flags.woff2'), 'font/woff2'),
  '/assets/TwemojiCountryFlags-Bymva2JV.woff2': binaryAsset(path.join(root, 'assets', 'flags.woff2'), 'font/woff2'),
  '/icon.svg': textAsset(path.join(root, 'assets', 'icon.svg'), 'image/svg+xml'),
  '/assets/icon.svg': textAsset(path.join(root, 'assets', 'icon.svg'), 'image/svg+xml')
};

const source = fs.readFileSync(path.join(root, 'worker', 'index.js'), 'utf8')
  .replace('__ASSET_TABLE__', JSON.stringify(assets));
fs.writeFileSync(path.join(out, 'server', 'index.js'), source);
fs.copyFileSync(path.join(root, '.openai', 'hosting.json'), path.join(out, '.openai', 'hosting.json'));
console.log(`built ${path.join(out, 'server', 'index.js')} (${fs.statSync(path.join(out, 'server', 'index.js')).size} bytes)`);
