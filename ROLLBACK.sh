#!/usr/bin/env bash
set -euo pipefail

BASELINE_COMMIT="f761ad9fecbf5be2add99837bd1fcb17f32e63e4"
ROOT="${1:-$(pwd)}"
cd "$ROOT"

git cat-file -e "${BASELINE_COMMIT}^{commit}"
git restore --source="$BASELINE_COMMIT" -- \
  .env.example \
  README.md \
  assets/main.css \
  compose.yaml \
  src/app.js \
  src/purity.js \
  src/template.js \
  tests/app.test.mjs \
  tests/purity.test.mjs

rm -f -- src/radar.js tests/radar.test.mjs

npm test
node --input-type=module - <<'NODE'
import { analyzeIpPurity } from './src/purity.js';

const restored = analyzeIpPurity({
  ip: '103.100.111.235',
  geo: { asn: 32043, provider: 'China Unicom', countryCode: 'CN' }
});
if (restored.humanTraffic !== restored.purityScore || restored.botTraffic !== restored.riskScore) {
  throw new Error('rollback semantic verification failed');
}
console.log(`RESTORED_BEHAVIOR humanTraffic=${restored.humanTraffic} purityScore=${restored.purityScore} botTraffic=${restored.botTraffic} riskScore=${restored.riskScore}`);
NODE
printf 'ROLLBACK_OK baseline=%s traffic_mix=derived_from_purity restored_behavior=humanTraffic_equals_purityScore\n' "$BASELINE_COMMIT"
