#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
skill_dir="$repo_root/.claude/skills/moonpresschat-setup"

required=(
  "$repo_root/README.md"
  "$repo_root/LICENSE"
  "$repo_root/.claude-plugin/plugin.json"
  "$repo_root/.claude-plugin/marketplace.json"
  "$repo_root/scripts/version.mjs"
  "$skill_dir/SKILL.md"
  "$skill_dir/readme.md"
  "$skill_dir/readme.html"
  "$skill_dir/readme.data.json"
  "$skill_dir/changelog.md"
  "$skill_dir/helper/moonpresschat-setup-helper.mjs"
  "$skill_dir/qa/verification-checklist.md"
)

for path in "${required[@]}"; do
  test -f "$path" || { echo "missing: $path" >&2; exit 1; }
done

grep -q '^name: moonpresschat-setup$' "$skill_dir/SKILL.md"
node "$repo_root/scripts/version.mjs" check

node --check "$skill_dir/helper/moonpresschat-setup-helper.mjs"
node --input-type=module - "$repo_root" <<'JS'
import { readFileSync, existsSync } from 'node:fs';
const root = process.argv[2];
const plugin = JSON.parse(readFileSync(`${root}/.claude-plugin/plugin.json`, 'utf8'));
const market = JSON.parse(readFileSync(`${root}/.claude-plugin/marketplace.json`, 'utf8'));
if (market.name !== 'moonpresschat' || market.plugins.length !== 1 || market.plugins[0].source !== './' || market.plugins[0].name !== plugin.name) throw new Error('Invalid marketplace entry');
if (Object.hasOwn(market.plugins[0], 'version')) throw new Error('plugin.json is the sole release version authority');
if (!Array.isArray(plugin.skills) || plugin.skills.length !== 1 || plugin.skills[0] !== './.claude/skills/moonpresschat-setup') throw new Error('Canonical skill entry is missing');
for (const path of plugin.skills) {
  if (!path.startsWith('./') || path.includes('..') || !existsSync(`${root}/${path}/SKILL.md`)) throw new Error('Invalid skill path');
}
JS

if grep -RInE '/Users/|BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY|sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}' \
  "$repo_root/README.md" "$skill_dir" --exclude='readme.html'; then
  echo 'private path or secret-shaped assignment found' >&2
  exit 1
fi

if grep -RInE 'normlstudio/quip-skill|npx skills( |@latest add )[^`\n]*quip-setup|https?://quip\.bot' \
  "$repo_root/README.md" "$skill_dir" --exclude='changelog.md' --exclude='readme.html'; then
  echo 'active legacy public identity found' >&2
  exit 1
fi

# Pre-5.0.0 plugin contract identifiers (namespace URLs, error codes, header)
# must not survive outside the changelog history.
if grep -RInE 'wp-json/quipbot|rest_route=/quipbot|quipbot_setup_|X-Quip-Setup' \
  "$repo_root/README.md" "$skill_dir" --exclude='changelog.md' --exclude='readme.html'; then
  echo 'pre-5.0.0 plugin contract identifier found' >&2
  exit 1
fi

echo 'moonpresschat-setup package validation passed'
