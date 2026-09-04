#!/usr/bin/env bash
set -euo pipefail

target="${1:?usage: ROLLBACK.sh TARGET_DIRECTORY [REPOSITORY]}"
repo="${2:-$(cd "$(dirname "$0")" && pwd)}"
baseline="${BASELINE_COMMIT:-fe56160210defb63043f1cc5758db1e7deba60d6}"
target="$(mkdir -p "$target" && cd "$target" && pwd)"
repo="$(cd "$repo" && pwd)"

case "$target" in
  /|"$repo")
    printf 'invalid rollback target: %s\n' "$target" >&2
    exit 2
    ;;
esac

git -C "$repo" cat-file -e "${baseline}^{commit}"
find "$target" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
git -C "$repo" archive "$baseline" | tar -x -C "$target"
printf 'restored %s from git commit %s\n' "$target" "$(git -C "$repo" rev-parse "$baseline")"
