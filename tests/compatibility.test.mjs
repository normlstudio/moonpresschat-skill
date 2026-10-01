import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compatibilityDecision, compareVersions, updateAction, showUpdateNotice, SKILL_VERSION, setupRequest, validateCallPath } from '../.claude/skills/moonpresschat-setup/helper/moonpresschat-setup-helper.mjs';

const compatible = {
  ok: true, status: 200, body: {
    available: true, plugin_version: '5.3.1', schema_versions: ['1.0'],
    capabilities: ['status', 'validate', 'apply', 'verify', 'rollback', 'go_live', 'provider_write', 'self_revoke'],
  },
};
const withFloors = (minimum, recommended) => ({ ...compatible, body: { ...compatible.body, setup_skill: { minimum, recommended } } });

test('legacy plugins without skill floors retain their original capability gate', () => {
  assert.equal(compatibilityDecision(compatible).api_allowed, true);
  assert.equal(compatibilityDecision({ ...compatible, body: { ...compatible.body, capabilities: [] } }).reason, 'missing-capabilities');
  assert.equal(compatibilityDecision({ ok: false, status: 404 }).reason, 'plugin-predates-api');
  assert.equal(compatibilityDecision({ ...compatible, body: { ...compatible.body, plugin_version: '4.8.0' } }).api_allowed, false);
});
test('minimum blocks API; recommendation offers the detected update while continuing', () => {
  const minimum = compatibilityDecision(withFloors('0.7.0', '0.7.0'));
  assert.equal(minimum.api_allowed, false);
  assert.equal(minimum.reason, 'setup-skill-too-old');
  assert.match(minimum.notice, /guided wp-admin/);
  const recommended = compatibilityDecision(withFloors('0.5.0', '0.7.0'));
  assert.equal(recommended.api_allowed, true);
  assert.match(recommended.notice, /newer Setup Skill/);
  assert.equal(compatibilityDecision(withFloors('0.6.0', '0.6.0')).notice, undefined);
});
test('malformed or inverted floors cannot unlock the API', () => {
  for (const minimum of [null, 'garbage', '0.6', '0.06.0', '9007199254740992.0.0']) {
    assert.equal(compatibilityDecision(withFloors(minimum, '0.7.0')).api_allowed, false);
  }
  assert.equal(compatibilityDecision(withFloors('0.8.0', '0.7.0')).api_allowed, false);
  assert.equal(compatibilityDecision({ ...compatible, body: { ...compatible.body, setup_skill: null } }).api_allowed, false);
});
test('semver ordering is numeric, including differing minor digit lengths', () => {
  assert.equal(compareVersions('0.10.0', '0.9.9'), 1);
  assert.equal(compareVersions('22.20.0', '22.20.0'), 0);
  assert.equal(compareVersions('22.19.9', '22.20.0'), -1);
});
test('update instructions match marketplace versus skills installation', () => {
  assert.match(updateAction('/tmp/.claude/plugins/cache/moonpresschat/helper.mjs'), /reload-plugins/);
  assert.match(updateAction('/tmp/.codex/plugins/cache/moonpresschat/helper.mjs'), /codex plugin marketplace upgrade moonpresschat/);
  assert.match(updateAction('/tmp/.agents/skills/moonpresschat-setup/helper.mjs'), /skills@latest update moonpresschat-setup -g/);
});
test('custom runtime homes retain marketplace update channels', () => {
  const roots = { CODEX_HOME: '/tmp/orca-account/home', CLAUDE_CONFIG_DIR: '/tmp/claude-account/home' };
  assert.match(updateAction('/tmp/orca-account/home/plugins/cache/moonpresschat/helper.mjs', roots), /codex plugin marketplace upgrade/);
  assert.match(updateAction('/tmp/claude-account/home/plugins/cache/moonpresschat/helper.mjs', roots), /reload-plugins/);
  assert.doesNotMatch(updateAction('/tmp/unknown/plugins/cache/moonpresschat/helper.mjs', {}), /npx/);
  assert.match(updateAction('/tmp/.agents/skills/moonpresschat-setup/helper.mjs', roots), /npx/);
});

test('after-update notice occurs once per installed version in non-secret state', () => {
  const dir = mkdtempSync(join(tmpdir(), 'moonpresschat-version-'));
  const messages = [];
  try {
    assert.equal(showUpdateNotice(dir, (line) => messages.push(line)), true);
    assert.equal(showUpdateNotice(dir, (line) => messages.push(line)), false);
    assert.equal(messages.length, 1);
    assert.match(messages[0], new RegExp(`updated to ${SKILL_VERSION}`));
    assert.equal(readFileSync(join(dir, 'last_seen_skill_version'), 'utf8').trim(), SKILL_VERSION);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});


test('authenticated setup calls include the client version and retain idempotency', async () => {
  const previous = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response('{"ok":true}', { status: 200 });
  };
  try {
    await setupRequest({ record: { rest_url: 'https://example.com/wp-json/moonpresschat/v1/setup', user_login: 'fixture' }, secret: 'non-secret-fixture' }, 'POST', '/setup/apply', '{}', 'fixture-idempotency');
    assert.equal(captured.url, 'https://example.com/wp-json/moonpresschat/v1/setup/apply');
    assert.equal(captured.options.headers['X-MoonPressChat-Setup-Client'], `moonpresschat-setup/${SKILL_VERSION}`);
    assert.equal(captured.options.headers['X-MoonPressChat-Setup-Idempotency-Key'], 'fixture-idempotency');
    assert.equal(captured.options.redirect, 'manual');
  } finally { globalThis.fetch = previous; }
});

test('generic bridge cannot escape setup or reach the provider secret channel', () => {
  assert.equal(validateCallPath('POST', '/setup/validate'), '/setup/validate');
  for (const path of ['/setup/../admin', '/setup/%2e%2e/admin', '/setup/provider?x=1', '/setup/provider/', '/setup\\provider', 'https://example.com/setup', '/setup/status?rest_route=/admin']) {
    assert.throws(() => validateCallPath('PUT', path));
  }
});


test('an unwritable notice location does not block setup', () => {
  const dir = mkdtempSync(join(tmpdir(), 'moonpresschat-notice-'));
  const file = join(dir, 'occupied');
  writeFileSync(file, 'fixture');
  try { assert.equal(showUpdateNotice(file, () => {}), false); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});
