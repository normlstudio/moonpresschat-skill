import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BOOTSTRAP_APP_ID, PLUGIN, normalizeSite, routeUrl, validateOperation, jsonRequest, discover, parseCallback, makeClient, installOrInspect, revoke, authorize, runBootstrap } from '../.claude/skills/moonpresschat-setup/helper/wordpress-bootstrap.mjs';
import { validateCallPath } from '../.claude/skills/moonpresschat-setup/helper/moonpresschat-setup-helper.mjs';

const site = 'https://example.test/wordpress';
const uuid = '99999999-1111-2222-3333-444444444444';
const identity = { uuid, app_id: BOOTSTRAP_APP_ID };
const root = { url: site, namespaces: ['wp/v2'], authentication: { 'application-passwords': { endpoints: { authorization: `${site}/wp-admin/authorize-application.php` } } } };
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const error = (code) => Object.assign(new Error(code), { code });

function fixture({ present = false, status = 'inactive', failAt, deleteFails = false } = {}) {
  let plugin = present ? { plugin: PLUGIN, status, version: '5.10.0' } : null;
  let record = null, secret = null, deleted = false;
  const writes = [], calls = [], settings = { live: present, provider: 'existing-provider' };
  const store = {
    read: () => record,
    save: (v) => { record = structuredClone(v); },
    put: (_user, value) => { secret = value; },
    get: () => secret,
    remove: () => { record = null; secret = null; },
  };
  const fetcher = async (url, init = {}) => {
    const u = new URL(url), path = u.pathname.replace('/wordpress/wp-json', '');
    calls.push({ path, method: init.method || 'GET', redirect: init.redirect });
    if (path === '/') return response(root);
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers.Authorization, `Basic ${Buffer.from('owner:fixture password').toString('base64')}`);
    if (failAt === path) return response({ message: 'never echo this' }, 403);
    if (path.endsWith('/introspect')) return response(identity);
    if (init.method === 'DELETE') {
      assert.equal(path, `/wp/v2/users/me/application-passwords/${uuid}`);
      if (deleteFails) return response({}, 500);
      deleted = true; return response({ deleted: true });
    }
    if (init.method === 'POST') {
      const body = JSON.parse(init.body); writes.push({ path, body });
      if (path === '/wp/v2/plugins') plugin = { plugin: PLUGIN, status: body.status, version: '5.10.0' };
      else plugin.status = body.status;
      return response(plugin);
    }
    if (path === '/wp/v2/plugins') return response([...(plugin ? [plugin] : []), { plugin: 'unrelated/plugin', status: 'active' }]);
    throw error('unexpected-route');
  };
  const consent = async (discovery) => {
    const r = { ...discovery, user: 'owner', cleanup: 'pending' }; store.save(r); store.put('owner', 'fixture password'); return r;
  };
  return { store, fetcher, authorize: consent, calls, writes, settings, wasDeleted: () => deleted };
}

test('site normalization preserves subdirectory and rejects credential/query/traversal URLs', () => {
  assert.equal(normalizeSite(site + '/'), site);
  for (const bad of ['https://owner:secret@example.test', site + '?token=x', site + '#x', 'https://example.test/a/../b', 'https://example.test/%2f', 'ftp://example.test', 'http://public.example.com']) assert.throws(() => normalizeSite(bad));
});

test('operation allowlist excludes arbitrary plugin, user, settings and setup writes', () => {
  for (const [method, path, body] of [
    ['POST', '/wp/v2/plugins', { slug: 'other', status: 'inactive' }],
    ['POST', '/wp/v2/plugins', { slug: 'moonpresschat', status: 'active' }],
    ['DELETE', `/wp/v2/users/me/application-passwords/${uuid}`, null],
    ['POST', '/wp/v2/settings', {}], ['POST', '/setup/go-live', {}],
  ]) assert.throws(() => validateOperation(method, path, body));
  validateOperation('DELETE', `/wp/v2/users/me/application-passwords/${uuid}`, null, uuid);
  assert.throws(() => routeUrl(site, 'pretty', '/wp/v2/plugins?rest_route=/wp/v2/users'));
  assert.equal(new URL(routeUrl(site, 'query', '/wp/v2/plugins')).searchParams.get('rest_route'), '/wp/v2/plugins');
});

test('discovery fallback only follows a genuine 404, never a forbidden response', async () => {
  const seen = [];
  const d = await discover(site, async (url) => { seen.push(url); return seen.length === 1 ? response({}, 404) : response(root); });
  assert.equal(d.mode, 'query'); assert.equal(seen.length, 2);
  let calls = 0;
  await assert.rejects(discover(site, async () => { calls++; return response({}, 403); }), /http-403/);
  assert.equal(calls, 1);
});

test('discovery rejects WP base and authorization URL mismatches', async () => {
  await assert.rejects(discover(site, async () => response({ ...root, url: 'https://other.test' })), /wordpress-url-mismatch/);
  const other = structuredClone(root); other.authentication['application-passwords'].endpoints.authorization = 'https://other.test/authorize';
  await assert.rejects(discover(site, async () => response(other)), /authorization-url-unavailable/);
});

test('transport disallows redirects and rejects non-JSON without echoing server content', async () => {
  await assert.rejects(jsonRequest(site, {}, async (_url, opts) => { assert.equal(opts.redirect, 'error'); throw new Error('secret remote response'); }), /^Error: request-failed$/);
  await assert.rejects(jsonRequest(site, {}, async () => new Response('secret', { headers: { 'Content-Type': 'text/html' } })), /non-json-response/);
});

test('callback requires exact state/site/path and a single unambiguous credential', () => {
  const p = new URLSearchParams({ state: 'test-state', site_url: site, user_login: 'owner', password: 'fixture password' });
  const url = '/return?' + p;
  assert.deepEqual(parseCallback(url, '/return', 'test-state', site), { user: 'owner', password: 'fixture password' });
  assert.throws(() => parseCallback(url, '/wrong', 'test-state', site), /path-mismatch/);
  assert.throws(() => parseCallback(url, '/return', 'different', site), /state-mismatch/);
  assert.throws(() => parseCallback(url, '/return', 'test-state', 'https://other.test'), /site-mismatch/);
  assert.throws(() => parseCallback(url + '&password=second', '/return', 'test-state', site), /duplicate/);
});

test('absent plugin installs inactive, never changes settings or invents hidden verification', async () => {
  const f = fixture(); const before = structuredClone(f.settings);
  const result = await runBootstrap(site, { install: true }, f);
  assert.equal(result.after, 'inactive'); assert.equal(result.visibility, 'unverified');
  assert.equal(result.ready_for_scoped_setup, false);
  assert.deepEqual(f.writes, [{ path: '/wp/v2/plugins', body: { slug: 'moonpresschat', status: 'inactive' } }]);
  assert.deepEqual(f.settings, before); assert.equal(f.wasDeleted(), true); assert.equal(f.store.read(), null);
});

test('existing active installation preserves all settings and makes zero plugin mutations', async () => {
  const f = fixture({ present: true, status: 'active' }); const before = structuredClone(f.settings);
  const result = await runBootstrap(site, { install: true, activate: true }, f);
  assert.equal(result.ready_for_scoped_setup, true); assert.deepEqual(f.writes, []); assert.deepEqual(f.settings, before);
});

test('inactive installation does not activate without explicit hidden-state decision', async () => {
  const f = fixture({ present: true }); const result = await runBootstrap(site, { install: true }, f);
  assert.equal(result.after, 'inactive'); assert.deepEqual(f.writes, []); assert.equal(result.ready_for_scoped_setup, false);
});

test('explicit activation activates exact existing plugin once and never reinstalls', async () => {
  const f = fixture({ present: true });
  const result = await runBootstrap(site, { install: true, activate: true }, f);
  assert.equal(result.activated, true); assert.equal(result.installed, false);
  assert.deepEqual(f.writes, [{ path: `/wp/v2/plugins/${PLUGIN}`, body: { status: 'active' } }]);
  assert.equal(result.visibility, 'unverified');
});

test('inventory access failure is not absence and still revokes credential', async () => {
  const f = fixture({ failAt: '/wp/v2/plugins' }); const result = await runBootstrap(site, { install: true }, f);
  assert.equal(result.error, 'http-403'); assert.deepEqual(f.writes, []); assert.equal(result.server_revoked, true);
});

test('failed revocation keeps credential and non-secret cleanup record for retry', async () => {
  const f = fixture({ deleteFails: true }); const result = await runBootstrap(site, {}, f);
  assert.equal(result.cleanup_pending, true); assert.equal(result.ready_for_scoped_setup, false);
  assert.equal(f.store.get(), 'fixture password'); assert.equal(f.store.read().uuid, uuid);
  assert.doesNotMatch(JSON.stringify(f.store.read()), /fixture password/);
});

test('foreign credential identity is never revoked', async () => {
  let deletes = 0;
  const record = { site, mode: 'pretty', cleanup: 'pending' };
  const result = await revoke(record, async (method) => { if (method === 'DELETE') deletes++; return { uuid, app_id: 'another-app' }; }, () => {}, () => {});
  assert.equal(deletes, 0); assert.equal(result.cleanup_pending, true);
});

test('server-revoked local cleanup retries without credential or another server call', async () => {
  let removed = false;
  const result = await revoke({ cleanup: 'server-revoked' }, null, () => {}, () => { removed = true; });
  assert.equal(result.server_revoked, true); assert.equal(removed, true);
});

test('setup helper remains restricted after bootstrap addition', () => {
  assert.throws(() => validateCallPath('POST', '/wp/v2/plugins'));
  assert.equal(validateCallPath('GET', '/setup/interview'), '/setup/interview');
});

test('core transport prevents other credential revocation despite arbitrary caller', async () => {
  const call = makeClient({ site, mode: 'pretty', user: 'owner', uuid }, 'fixture');
  await assert.rejects(call('DELETE', '/wp/v2/users/me/application-passwords/00000000-1111-2222-3333-444444444444'), /operation-refused/);
});

test('real loopback authorization stores before returning, exact callback protected', async () => {
  const events = [], store = { save: () => events.push('save'), put: () => events.push('put') };
  let responsePromise;
  const record = await authorize({ site, mode: 'pretty', authorization_url: root.authentication['application-passwords'].endpoints.authorization }, store, (url) => {
    const auth = new URL(url); assert.equal(auth.searchParams.get('app_id'), BOOTSTRAP_APP_ID);
    const callback = new URL(auth.searchParams.get('success_url'));
    callback.searchParams.set('site_url', site); callback.searchParams.set('user_login', 'owner'); callback.searchParams.set('password', 'fixture');
    responsePromise = fetch(callback); return { status: 0 };
  }, 2000);
  assert.deepEqual(events, ['save', 'put']); assert.equal(record.user, 'owner');
  const r = await responsePromise; assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
  const body = await r.text(); assert.doesNotMatch(body, /fixture/); assert.match(body, /replaceState/);
});

test('bootstrap CLI remains explicitly experimental and has no default public mutation', () => {
  const helper = fileURLToPath(new URL('../.claude/skills/moonpresschat-setup/helper/wordpress-bootstrap.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [helper, 'bootstrap', site, '--install'], { env: { ...process.env, MOONPRESSCHAT_BOOTSTRAP_EXPERIMENTAL: '' }, encoding: 'utf8' });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /experimental-bootstrap-disabled|credential-backend-unsupported/);
});

test('credential read failure after authorization retains recoverable state and reports cleanup pending', async () => {
  const f = fixture(); f.store.get = () => { throw error('keychain-read-failed'); };
  const result = await runBootstrap(site, { install: true }, f);
  assert.equal(result.cleanup_pending, true); assert.equal(result.cleanup_reason, 'credential-read-failed');
  assert.equal(result.ready_for_scoped_setup, false); assert.deepEqual(f.writes, []);
  assert.equal(f.store.read().cleanup, 'pending');
});

test('confirmed server revocation survives a local deletion failure without false server failure', async () => {
  const record = { site, mode: 'pretty', user: 'owner', uuid };
  const result = await revoke(record, async (method) => method === 'GET' ? identity : { deleted: true }, () => {}, () => { throw error('local-cleanup-failed'); });
  assert.equal(result.server_revoked, true); assert.equal(result.cleanup_pending, true); assert.equal(record.cleanup, 'server-revoked');
});
