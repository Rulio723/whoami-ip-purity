#!/usr/bin/env bash
set -euo pipefail

BASELINE_COMMIT="c8ac29d21b621755e30b31a5c748c218fe95be99"
ROOT="${1:-$(pwd)}"
cd "$ROOT"

git cat-file -e "${BASELINE_COMMIT}^{commit}"
git restore --source="$BASELINE_COMMIT" -- \
  README.md \
  src/template.js \
  tests/app.test.mjs

npm test
node --input-type=module - <<'NODE'
import { renderPage } from './src/template.js';

const html = renderPage({
  ip: '103.100.111.235',
  geo: {},
  client: { browser: 'Chrome', os: 'Windows', device: 'Desktop' }
});
if (!html.includes('curl ip.rulio.sryze.cc') || html.includes('curl rulio.top')) {
  throw new Error('rollback domain verification failed');
}
console.log('RESTORED_BEHAVIOR footer="curl ip.rulio.sryze.cc" ogUrl="https://ip.rulio.sryze.cc/"');
NODE
printf 'ROLLBACK_OK baseline=%s primary_domain=ip.rulio.sryze.cc restored\n' "$BASELINE_COMMIT"
