#!/usr/bin/env bash

set -euo pipefail

source_name="${1:-}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temp_root="$(mktemp -d "${TMPDIR:-/tmp}/engineering-diagram-sync.XXXXXX")"
trap 'rm -rf "$temp_root"' EXIT

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

clone_source() {
  local repository="$1"
  local ref="$2"
  local destination="$3"
  git -c http.version=HTTP/1.1 clone --depth 1 --branch "$ref" "$repository" "$destination"
}

require_command git
require_command gh
require_command node
require_command rsync

case "$source_name" in
  archify)
    ref="$(gh api repos/tt-a1i/archify/tags --jq '.[0].name')"
    commit="$(gh api repos/tt-a1i/archify/tags --jq '.[0].commit.sha')"
    clone_source "https://github.com/tt-a1i/archify.git" "$ref" "$temp_root/source"
    mkdir -p "$temp_root/vendor"
    rsync -a \
      "$temp_root/source/archify/assets" \
      "$temp_root/source/archify/bin" \
      "$temp_root/source/archify/recipes" \
      "$temp_root/source/archify/renderers" \
      "$temp_root/source/archify/schemas" \
      "$temp_root/source/archify/scripts" \
      "$temp_root/vendor/"
    cp \
      "$temp_root/source/archify/LICENSE" \
      "$temp_root/source/archify/SKILL.md" \
      "$temp_root/source/archify/package.json" \
      "$temp_root/vendor/"
    rsync -a --delete "$temp_root/vendor/" "$repo_root/vendor/archify/"
    ;;
  architecture-diagram-skill)
    ref="main"
    clone_source "https://github.com/konraddzbik/architecture-diagram-skill.git" "$ref" "$temp_root/source"
    commit="$(git -C "$temp_root/source" rev-parse HEAD)"
    mkdir -p "$temp_root/vendor/skills/architecture-diagram"
    cp "$temp_root/source/LICENSE" "$temp_root/vendor/"
    cp "$temp_root/source/skills/architecture-diagram/SKILL.md" "$temp_root/vendor/skills/architecture-diagram/"
    rsync -a --delete "$temp_root/vendor/" "$repo_root/vendor/architecture-diagram-skill/"
    ;;
  ui-ux-pro-max-skill)
    ref="main"
    clone_source "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git" "$ref" "$temp_root/source"
    commit="$(git -C "$temp_root/source" rev-parse HEAD)"
    mkdir -p "$temp_root/vendor/.claude/skills/ui-ux-pro-max"
    cp "$temp_root/source/LICENSE" "$temp_root/vendor/"
    cp "$temp_root/source/.claude/skills/ui-ux-pro-max/SKILL.md" "$temp_root/vendor/.claude/skills/ui-ux-pro-max/"
    rsync -a --delete "$temp_root/vendor/" "$repo_root/vendor/ui-ux-pro-max-skill/"
    ;;
  *)
    echo "Usage: scripts/sync-upstreams.sh {archify|architecture-diagram-skill|ui-ux-pro-max-skill}" >&2
    exit 2
    ;;
esac

node "$repo_root/scripts/update-upstream-lock.mjs" "$source_name" "$ref" "$commit"
npm --prefix "$repo_root" run check
