import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const skill = '.claude/skills/moonpresschat-setup/';
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const manifest = JSON.parse(read('.claude-plugin/plugin.json'));
const version = process.argv[2] === 'set' ? process.argv[3] : manifest.version;
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version ?? '')) throw new Error('Use numeric MAJOR.MINOR.PATCH');
const targets = [
  [skill + 'SKILL.md', /^  version: "\d+\.\d+\.\d+"$/m, `  version: "${version}"`],
  [skill + 'helper/moonpresschat-setup-helper.mjs', /export const SKILL_VERSION = '\d+\.\d+\.\d+';/, `export const SKILL_VERSION = '${version}';`],
];
if (process.argv[2] === 'set') {
  for (const [path, pattern, stamp] of targets) {
    const text = read(path);
    if (!pattern.test(text)) throw new Error(`Missing version stamp: ${path}`);
    writeFileSync(resolve(root, path), text.replace(pattern, stamp));
  }
  manifest.version = version;
  writeFileSync(resolve(root, '.claude-plugin/plugin.json'), JSON.stringify(manifest, null, 2) + '\n');
  const dataPath = resolve(root, skill + 'readme.data.json');
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  data.version = version;
  // covers describes reconciled documentation; update it only when regenerating the guide.
  writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
} else {
  for (const [path, pattern, stamp] of targets) {
    if (read(path).match(pattern)?.[0] !== stamp) throw new Error(`Version differs from plugin.json: ${path}`);
  }
  const data = JSON.parse(read(skill + 'readme.data.json'));
  if (data.version !== version || data.covers !== version) throw new Error('Regenerate the human docs for this version');
  if (!read(skill + 'readme.md').includes(`Covers SKILL.md v${version}`)) throw new Error('Human guide version is stale');
  if (!read(skill + 'changelog.md').includes(`## ${version} — `)) throw new Error('Version needs a changelog entry');
  if (!read(skill + 'readme.html').includes(version)) throw new Error('Rendered guide version is stale');
  console.log(`Version ${version} is consistent`);
}
