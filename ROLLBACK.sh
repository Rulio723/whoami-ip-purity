#!/usr/bin/env bash
set -euo pipefail

BASELINE_COMMIT="00789c96a3400b300e50e668b4dd2d330959d9da"
ROOT="${1:-$(pwd)}"
cd "$ROOT"

git cat-file -e "${BASELINE_COMMIT}^{commit}"
git restore --source="$BASELINE_COMMIT" -- \
  README.md \
  assets/main.css \
  client.js \
  docs/preview.png \
  src/purity.js \
  src/template.js \
  tests/app.test.mjs \
  tests/purity.test.mjs

npm test
printf 'ROLLBACK_OK baseline=%s privacy_toggle=absent ip_classification=absent\n' "$BASELINE_COMMIT"