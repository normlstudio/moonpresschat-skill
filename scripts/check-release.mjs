import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function checkRelease({ base, head, source, target, cwd = process.cwd() }) {
  if (target !== 'main') return;
  if (source !== 'develop') throw new Error('Promote reviewed develop to release-only main.');
  const show = (ref, path) => execFileSync('git', ['show', `${ref}:${path}`], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const version = (ref) => {
    let text;
    // Released 0.5.0 predates the marketplace manifest.
    const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', ref], { cwd, encoding: 'utf8' }).split('\n');
    if (paths.includes('.claude-plugin/plugin.json')) text = JSON.parse(show(ref, '.claude-plugin/plugin.json')).version;
    else text = show(ref, '.claude/skills/moonpresschat-setup/SKILL.md').match(/^  version: "([^"]+)"$/m)?.[1];
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(text ?? '')) throw new Error('Invalid release version.');
    const parts = text.split('.').map(Number);
    if (!parts.every(Number.isSafeInteger)) throw new Error('Invalid release version.');
    return parts;
  };
  const before = version(base), after = version(head);
  const difference = after.map((n, i) => n - before[i]).find(n => n !== 0) ?? 0;
  if (difference <= 0) throw new Error('A main promotion must increase the released version.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [base, head, source, target] = process.argv.slice(2);
  if (![base, head, source, target].every(Boolean)) throw new Error('Usage: check-release.mjs BASE HEAD SOURCE TARGET');
  checkRelease({ base, head, source, target });
  console.log('Release promotion contract passed');
}
