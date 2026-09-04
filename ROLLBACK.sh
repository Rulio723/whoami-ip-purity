#!/usr/bin/env bash
set -euo pipefail

target="${1:?usage: ROLLBACK.sh TARGET_DIRECTORY [REPOSITORY]}"
repo="${2:-$(cd "$(dirname "$0")" && pwd)}"
baseline="${BASELINE_COMMIT:-3637f41e3ff3a1156fe1422cedd3d0096ef8fb38}"
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
