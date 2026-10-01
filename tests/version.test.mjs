import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('release bump stamps active copies and validator rejects instruction drift', () => {
  const source = fileURLToPath(new URL('../', import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), 'moonpresschat-stamps-'));
  const skill = '.claude/skills/moonpresschat-setup/';
  const run = (...args) => spawnSync(process.execPath, [join(dir, 'scripts/version.mjs'), ...args], { encoding: 'utf8' });
  try {
    for (const name of ['.claude', '.claude-plugin', 'scripts', 'README.md']) cpSync(join(source, name), join(dir, name), { recursive: true });
    let result = run('set', '0.6.1');
    assert.equal(result.status, 0, result.stderr);
    const log = join(dir, skill, 'changelog.md');
    writeFileSync(log, '## 0.6.1 — fixture\n\n- Version stamping regression.\n\n' + readFileSync(log, 'utf8'));
    result = run('check'); assert.equal(result.status, 0, result.stderr);
    for (const name of ['README.md', skill + 'SKILL.md', skill + 'actions/preflight.md', skill + 'contracts/distribution-and-updates.md', skill + 'readme.md', skill + 'readme.html']) {
      const path = join(dir, name), original = readFileSync(path, 'utf8');
      writeFileSync(path, original.replace(/([Vv]ersion )0\.6\.1/, '$10.6.0'));
      result = run('check'); assert.notEqual(result.status, 0, name + ' drift must fail');
      writeFileSync(path, original);
    }
    assert.match(readFileSync(join(dir, skill, 'actions/preflight.md'), 'utf8'), /plugin_version: 5\.0\.0/);
    assert.match(readFileSync(log, 'utf8'), /## 0\.6\.0 — /, 'Release history must not be stamped');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
