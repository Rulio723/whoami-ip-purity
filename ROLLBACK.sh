#!/usr/bin/env bash
set -euo pipefail
target="${1:-MODIFIED_FILE}"
baseline="${2:-BASELINE_FILE}"
cp -- "$baseline" "$target"
printf 'restored %s from %s\n' "$target" "$baseline"
