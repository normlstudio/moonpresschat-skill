import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkRelease } from '../scripts/check-release.mjs';

test('main rejects feature promotions, unchanged versions and rollback versions', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'moonpress-release-'));
  const env = { ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'qa@example.invalid', GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'qa@example.invalid' };
  const git = (...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = () => { git('add', '.'); git('commit', '-m', 'Fixture'); return git('rev-parse', 'HEAD'); };
  try {
    git('init');
    mkdirSync(join(cwd, '.claude/skills/moonpresschat-setup'), { recursive: true });
    writeFileSync(join(cwd, '.claude/skills/moonpresschat-setup/SKILL.md'), 'metadata:\n  version: "0.5.0"\n');
    const legacy = commit();
    mkdirSync(join(cwd, '.claude-plugin'));
    const manifest = join(cwd, '.claude-plugin/plugin.json');
    writeFileSync(manifest, JSON.stringify({ version: '0.6.0' }));
    const candidate = commit();
    const args = { cwd, base: legacy, head: candidate, source: 'develop', target: 'main' };
    assert.doesNotThrow(() => checkRelease(args));
    assert.throws(() => checkRelease({ ...args, source: 'feature' }), /reviewed develop/);
    assert.throws(() => checkRelease({ ...args, base: candidate }), /increase/);
    assert.throws(() => checkRelease({ ...args, base: candidate, head: legacy }), /increase/);
    writeFileSync(manifest, JSON.stringify({ version: 'garbage' }));
    const malformed = commit();
    assert.throws(() => checkRelease({ ...args, head: malformed }), /Invalid release version/);
    assert.doesNotThrow(() => checkRelease({ ...args, target: 'develop', source: 'feature' }));
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
