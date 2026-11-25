#!/usr/bin/env bash
set -euo pipefail

upstream_url="${1:-https://github.com/alephium/alephium-frontend.git}"
upstream_ref="${2:-master}"

# Never disturb uncommitted changes when this helper is run outside Actions.
if [[ -n "$(git status --porcelain)" ]]; then
  printf '::error::The working tree must be clean before merging upstream.\n' >&2
  exit 1
fi

git fetch --no-tags "$upstream_url" "$upstream_ref"
upstream_sha="$(git rev-parse FETCH_HEAD)"

if git merge-base --is-ancestor "$upstream_sha" HEAD; then
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    printf 'changed=false\n' >> "$GITHUB_OUTPUT"
  fi
  printf 'The fork already contains upstream %s.\n' "$upstream_sha"
  exit 0
fi

# The workflow dispatches the explorer deployment explicitly after validation,
# so skip duplicate push workflows, including unrelated wallet builds.
if ! git merge --no-ff -m "Merge Alephium upstream ${upstream_sha:0:12} [skip ci]" "$upstream_sha"; then
  if git rev-parse --verify --quiet MERGE_HEAD > /dev/null; then
    git merge --abort
  fi
  printf '::error::Upstream conflicts with this fork. Resolve the conflicts manually; nothing was pushed.\n' >&2
  exit 1
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'changed=true\nupstream_sha=%s\n' "$upstream_sha" >> "$GITHUB_OUTPUT"
fi
