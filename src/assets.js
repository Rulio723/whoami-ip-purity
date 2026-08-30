import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifestPath = path.join(root, 'public', 'assets', 'site-manifest.json');

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Browser asset manifest not found: ${manifestPath}. Run npm run build first.`);
}

export const browserAssets = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
