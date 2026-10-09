import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const helper = fileURLToPath(new URL('../.claude/skills/moonpresschat-setup/helper/moonpresschat-setup-helper.mjs', import.meta.url));
const capabilities = ['status', 'validate', 'apply', 'verify', 'rollback', 'go_live', 'provider_write', 'self_revoke'];

async function run(args, env, preload, entry = helper) {
  const child = spawn(process.execPath, [...(preload ? ['--import', preload] : []), entry, ...args], { env });
  let stdout = '', stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  return await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code, signal) => { clearTimeout(timer); resolve({ code, signal, stdout, stderr }); });
  });
}

test('real CLI connects public preflight and gates every authenticated setup command', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'moonpresschat-cli-'));
  const bin = join(dir, 'bin'); mkdirSync(bin);
  const trap = join(dir, 'forbidden-auth');
  for (const name of ['security', 'open']) {
    writeFileSync(join(bin, name), `#!/bin/sh\nprintf 'called' > '${trap}'\nexit 1\n`, { mode: 0o700 });
  }
  const env = { ...process.env, PATH: `${bin}:${dirname(process.execPath)}:${process.env.PATH}`, MOONPRESSCHAT_SETUP_NOTICE_DIR: join(dir, 'notice') };
  let floors, calls = 0;
  const forbidden = [];
  const server = createServer((req, res) => {
    calls++;
    res.setHeader('Content-Type', 'application/json');
    if (!req.url.includes('/setup/compatibility')) { forbidden.push(req.url); res.statusCode = 500; res.end('{}'); return; }
    res.end(JSON.stringify({ available: true, api_version: '1.0', plugin_version: '5.9.1', schema_versions: ['1.0'], capabilities, ...(floors ? { setup_skill: floors } : {}) }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    let result = await run(['preflight', origin], env);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).api_allowed, true);
    assert.match(result.stderr, /Setup Skill updated/);
    result = await run(['preflight', origin], env);
    assert.equal(result.code, 0, result.stderr);
    assert.doesNotMatch(result.stderr, /Setup Skill updated/);

    const link = join(dir, 'helper-link.mjs'); symlinkSync(helper, link);
    result = await run(['preflight', origin], env, undefined, link);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).api_allowed, true, 'Symlink entry must run the actual CLI');

    floors = { minimum: '0.7.0', recommended: '0.7.0' };
    for (const args of [
      ['connect', origin], ['status', origin], ['call', origin, 'POST', '/setup/apply'],
      ['call', '--body', join(dir, 'nonexistent.json'), origin, 'POST', '/setup/validate'],
      ['provider', origin, 'openai', 'fixture-model'],
    ]) {
      result = await run(args, env);
      assert.equal(result.code, 0, `${args[0]}: ${result.stderr}`);
      assert.equal(JSON.parse(result.stdout).reason, 'setup-skill-too-old');
      assert.equal(JSON.parse(result.stdout).api_allowed, false);
    }
    assert.equal(existsSync(trap), false, 'No browser or credential backend may run below the minimum');
    assert.deepEqual(forbidden, []);

    floors = { minimum: '0.5.0', recommended: '0.7.0' };
    result = await run(['preflight', origin], env);
    assert.equal(JSON.parse(result.stdout).api_allowed, true);
    assert.match(result.stderr, /newer Setup Skill/);

    const before = calls;
    result = await run(['call', origin, 'PUT', '/setup/provider?bypass=1'], env);
    assert.equal(result.code, 2);
    assert.equal(calls, before, 'Invalid route must be rejected before any site request');

    const preload = join(dir, 'older-node.mjs');
    writeFileSync(preload, "Object.defineProperty(process.versions, 'node', {value:'22.19.0'});\n");
    result = await run(['preflight', origin], env, preload);
    assert.equal(result.code, 2);
    assert.match(result.stderr, /node-version-unsupported/);
    assert.equal(calls, before, 'Old Node must stop before site contact');
    assert.equal(existsSync(trap), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});
