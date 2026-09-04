#!/usr/bin/env bash
set -euo pipefail

BASELINE_COMMIT="5fc6c27ac69e020823fd6bb0f5b07dae8c41eb91"
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
printf 'ROLLBACK_OK baseline=%s semantic_colors=absent single_pink_badge=restored\n' "$BASELINE_COMMIT"
