import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const skill = '.claude/skills/moonpresschat-setup/';
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const manifest = JSON.parse(read('.claude-plugin/plugin.json'));
const version = process.argv[2] === 'set' ? process.argv[3] : manifest.version;
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version ?? '')) throw new Error('Use numeric MAJOR.MINOR.PATCH');
const active = /\b([Vv]ersion )\d+\.\d+\.\d+/g;
const targets = [
  [skill + 'SKILL.md', /^  version: "\d+\.\d+\.\d+"$/m, `  version: "${version}"`],
  [skill + 'helper/moonpresschat-setup-helper.mjs', /export const SKILL_VERSION = '\d+\.\d+\.\d+';/, `export const SKILL_VERSION = '${version}';`],
  ['README.md', /^\d+\.\d+\.\d+ release candidate/m, `${version} release candidate`],
  ...['README.md', skill + 'SKILL.md', skill + 'actions/preflight.md', skill + 'contracts/distribution-and-updates.md', skill + 'readme.md', skill + 'readme.html'].map(path => [path, active, `$1${version}`]),
  [skill + 'readme.md', /Covers SKILL.md v\d+\.\d+\.\d+/, `Covers SKILL.md v${version}`],
  [skill + 'readme.md', /Last changelog entry: v\d+\.\d+\.\d+/, `Last changelog entry: v${version}`],
  [skill + 'readme.html', /(<span class="ver"><span class="dot"><\/span>v)\d+\.\d+\.\d+/, `$1${version}`],
  [skill + 'readme.html', /What works in \d+\.\d+\.\d+/, `What works in ${version}`],
  [skill + 'readme.html', /Covers SKILL.md v\d+\.\d+\.\d+/, `Covers SKILL.md v${version}`],
];
for (const [path, pattern, stamp] of targets) {
  const text = read(path);
  pattern.lastIndex = 0;
  if (!pattern.test(text)) throw new Error(`Missing version stamp: ${path}`);
  pattern.lastIndex = 0;
  const stamped = text.replace(pattern, stamp);
  if (process.argv[2] === 'set') writeFileSync(resolve(root, path), stamped);
  else if (text !== stamped) throw new Error(`Version differs from plugin.json: ${path}`);
}
const dataPath = resolve(root, skill + 'readme.data.json');
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
if (process.argv[2] === 'set') {
  manifest.version = version;
  writeFileSync(resolve(root, '.claude-plugin/plugin.json'), JSON.stringify(manifest, null, 2) + '\n');
  data.version = version;
  // Stamp current declarations; maintainers must still reconcile meaning and changelog.
  data.covers = version;
  data.callout.text = data.callout.text.replace(active, `$1${version}`);
  data.capabilities.label = `What works in ${version}`;
  writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
} else {
  if (data.version !== version || data.covers !== version || data.capabilities.label !== `What works in ${version}` || data.callout.text !== data.callout.text.replace(active, `$1${version}`)) throw new Error('Human guide data version is stale');
  if (!read(skill + 'changelog.md').includes(`## ${version} — `)) throw new Error('Version needs a changelog entry');
  console.log(`Version ${version} is consistent`);
}
