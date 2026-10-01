#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"
node scripts/version.mjs set "${1:?Usage: scripts/set-version.sh MAJOR.MINOR.PATCH}"
