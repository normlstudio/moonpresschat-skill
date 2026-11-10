#!/usr/bin/env node
/** Experimental bootstrap candidate. No provider, license, setup or general WP writes. */
import { createServer } from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BOOTSTRAP_APP_ID = '1ac8286c-9f52-4c8d-b383-0db667e4a820';
export const PLUGIN = 'moonpresschat/moonpresschat';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cleanError = (code) => Object.assign(new Error(code), { code });
const localHost = (h) => ['localhost', '127.0.0.1', '[::1]'].includes(h) || /\.(localhost|local|test)$/.test(h);

export function normalizeSite(input) {
  let u; try { u = new URL(input); } catch { throw cleanError('invalid-site-url'); }
  if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || u.search || u.hash
    || /[%\\]/.test(u.pathname) || /(?:^|\/)\.{1,2}(?:\/|$)/.test(String(input).replace(/^https?:\/\/[^/]+/, ''))) throw cleanError('invalid-site-url');
  if (u.protocol === 'http:' && !localHost(u.hostname)) throw cleanError('https-required');
  return u.origin + u.pathname.replace(/\/+$/, '');
}

export function routeUrl(site, mode, route) {
  const base = normalizeSite(site);
  if (!/^\/(?:wp\/v2\/plugins(?:\/moonpresschat\/moonpresschat)?|wp\/v2\/users\/me\/application-passwords\/(?:introspect|[a-f0-9-]+))$/.test(route)) throw cleanError('bootstrap-route-refused');
  return mode === 'query' ? `${base}/?rest_route=${encodeURIComponent(route)}` : mode === 'pretty' ? `${base}/wp-json${route}` : (() => { throw cleanError('invalid-rest-mode'); })();
}

export function validateOperation(method, route, body, ownUuid) {
  if (method === 'GET' && ['/wp/v2/plugins', '/wp/v2/users/me/application-passwords/introspect'].includes(route) && body == null) return;
  if (method === 'POST' && route === '/wp/v2/plugins' && JSON.stringify(body) === JSON.stringify({ slug: 'moonpresschat', status: 'inactive' })) return;
  if (method === 'POST' && route === `/wp/v2/plugins/${PLUGIN}` && JSON.stringify(body) === JSON.stringify({ status: 'active' })) return;
  if (method === 'DELETE' && UUID.test(ownUuid || '') && route === `/wp/v2/users/me/application-passwords/${ownUuid}` && body == null) return;
  throw cleanError('bootstrap-operation-refused');
}

export async function jsonRequest(url, options = {}, fetcher = fetch) {
  let response;
  try { response = await fetcher(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(30000) }); }
  catch { throw cleanError('request-failed'); }
  if (!response.ok) throw cleanError(`http-${response.status}`);
  // Do not print remote errors, headers, or response bodies.
  if (!/application\/json/i.test(response.headers.get('content-type') || '')) throw cleanError('non-json-response');
  const text = await response.text();
  if (text.length > 2 * 1024 * 1024) throw cleanError('response-too-large');
  try { return JSON.parse(text); } catch { throw cleanError('invalid-json-response'); }
}

export async function discover(site, fetcher = fetch) {
  site = normalizeSite(site);
  let last;
  for (const mode of ['pretty', 'query']) {
    const url = mode === 'pretty' ? `${site}/wp-json/` : `${site}/?rest_route=/`;
    let root;
    try { root = await jsonRequest(url, {}, fetcher); }
    catch (e) { last = e; if (e.code !== 'http-404') throw e; continue; }
    if (normalizeSite(root.url) !== site) throw cleanError('wordpress-url-mismatch');
    const auth = root.authentication?.['application-passwords']?.endpoints?.authorization;
    const expected = `${site}/wp-admin/authorize-application.php`;
    if (auth !== expected) throw cleanError('authorization-url-unavailable-or-mismatched');
    if (!root.namespaces?.includes('wp/v2')) throw cleanError('wordpress-rest-unavailable');
    return { site, mode, authorization_url: auth };
  }
  throw last || cleanError('wordpress-rest-unavailable');
}

export function parseCallback(raw, expectedPath, expectedState, site) {
  const u = new URL(raw, 'http://127.0.0.1');
  if (u.pathname !== expectedPath) throw cleanError('callback-path-mismatch');
  for (const key of ['state', 'success', 'site_url', 'user_login', 'password']) if (u.searchParams.getAll(key).length > 1) throw cleanError('duplicate-callback-field');
  const state = Buffer.from(u.searchParams.get('state') || '');
  const expected = Buffer.from(expectedState);
  if (state.length !== expected.length || !timingSafeEqual(state, expected)) throw cleanError('callback-state-mismatch');
  if (u.searchParams.get('success') === 'false') throw cleanError('owner-declined');
  if (normalizeSite(u.searchParams.get('site_url')) !== site) throw cleanError('callback-site-mismatch');
  const user = u.searchParams.get('user_login') || '', password = u.searchParams.get('password') || '';
  if (!user || !password || /[\r\n\x00:]/.test(user) || /[\r\n\x00]/.test(password)) throw cleanError('invalid-callback-credential');
  return { user, password };
}

export function makeClient(record, password, fetcher = fetch) {
  const site = normalizeSite(record.site);
  if (!record.user || /[:\r\n]/.test(record.user)) throw cleanError('invalid-user');
  return async (method, route, body = null) => {
    validateOperation(method, route, body, record.uuid);
    const url = routeUrl(site, record.mode, route);
    return jsonRequest(url, {
      method,
      headers: { Authorization: `Basic ${Buffer.from(`${record.user}:${password}`).toString('base64')}`, 'Content-Type': 'application/json' },
      ...(body == null ? {} : { body: JSON.stringify(body) }),
    }, fetcher);
  };
}

export function selectPlugin(rows) {
  if (!Array.isArray(rows)) throw cleanError('invalid-plugin-inventory');
  const matches = rows.filter((x) => x?.plugin === PLUGIN);
  if (matches.length > 1) throw cleanError('duplicate-plugin-identity');
  const plugin = matches[0];
  if (plugin && !['active', 'inactive'].includes(plugin.status)) throw cleanError('unsupported-plugin-status');
  if (plugin?.network_only) throw cleanError('multisite-guided-only');
  return plugin || null;
}

/** Install separately from activation; existing settings are never written. */
export async function installOrInspect(call, { install = false, activate = false } = {}) {
  let plugin = selectPlugin(await call('GET', '/wp/v2/plugins'));
  const before = plugin?.status || 'absent';
  let installed = false, activated = false;
  if (!plugin && install) {
    await call('POST', '/wp/v2/plugins', { slug: 'moonpresschat', status: 'inactive' });
    installed = true;
    plugin = selectPlugin(await call('GET', '/wp/v2/plugins'));
    if (!plugin || plugin.status !== 'inactive') throw cleanError('installed-plugin-state-unexpected');
  }
  if (plugin?.status === 'inactive' && activate) {
    await call('POST', `/wp/v2/plugins/${PLUGIN}`, { status: 'active' });
    activated = true;
    plugin = selectPlugin(await call('GET', '/wp/v2/plugins'));
    if (!plugin || plugin.status !== 'active') throw cleanError('activation-not-verified');
  }
  return { before, after: plugin?.status || 'absent', installed, activated, plugin_version: typeof plugin?.version === 'string' ? plugin.version : null,
    visibility: 'unverified', next: plugin?.status === 'active' ? 'scoped-setup-connect-and-check-visibility' : 'activation-or-install-approval-required' };
}

/** Revoke only the credential authenticated here. Retain state on uncertainty. */
export async function revoke(record, call, save, remove) {
  try {
    if (record.cleanup === 'server-revoked') { remove(); return { server_revoked: true, cleanup_pending: false }; }
    const identity = await call('GET', '/wp/v2/users/me/application-passwords/introspect');
    if (identity?.app_id !== BOOTSTRAP_APP_ID || !UUID.test(identity?.uuid || '')) throw cleanError('credential-identity-mismatch');
    if (record.uuid && record.uuid !== identity.uuid) throw cleanError('credential-identity-changed');
    record.uuid = identity.uuid; record.cleanup = 'pending'; save(record);
    const result = await call('DELETE', `/wp/v2/users/me/application-passwords/${record.uuid}`);
    if (result?.deleted !== true) throw cleanError('revocation-not-confirmed');
    record.cleanup = 'server-revoked'; save(record);
    try { remove(); } catch { return { server_revoked: true, cleanup_pending: true, cleanup_reason: 'local-cleanup-failed' }; }
    return { server_revoked: true, cleanup_pending: false };
  } catch (e) {
    const serverRevoked = record.cleanup === 'server-revoked';
    if (!serverRevoked) record.cleanup = 'pending';
    save(record);
    return { server_revoked: serverRevoked, cleanup_pending: true, cleanup_reason: /^[a-z0-9-]+$/.test(e.code || '') ? e.code : 'cleanup-failed' };
  }
}

function localStore(site) {
  const home = process.env.HOME;
  if (!home) throw cleanError('home-unavailable');
  const id = createHash('sha256').update(site).digest('hex');
  const dir = join(home, '.moonpresschat-setup', 'bootstrap');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, `${id}.json`), service = `moonpresschat-bootstrap:${id}`;
  const save = (record) => writeFileSync(file, JSON.stringify(record, null, 2) + '\n', { mode: 0o600 });
  const read = () => existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  const get = () => { const r = spawnSync('security', ['find-generic-password', '-s', service, '-w'], { encoding: 'utf8' }); if (r.status !== 0) throw cleanError('credential-unavailable'); return r.stdout.replace(/\n$/, ''); };
  const put = (user, password) => {
    const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    if (/[\r\n]/.test(user + password)) throw cleanError('invalid-credential');
    const r = spawnSync('security', ['-i'], { input: `add-generic-password -U -s "${service}" -a "${esc(user)}" -w "${esc(password)}"\n`, encoding: 'utf8' });
    if (r.status !== 0) throw cleanError('keychain-store-failed');
  };
  const remove = () => {
    const r = spawnSync('security', ['delete-generic-password', '-s', service], { encoding: 'utf8' });
    if (r.status !== 0 && !/could not be found/i.test(`${r.stdout} ${r.stderr}`)) throw cleanError('local-credential-cleanup-failed');
    if (existsSync(file)) unlinkSync(file);
  };
  return { read, save, get, put, remove };
}

export async function authorize(discovery, store, opener = (url) => spawnSync('open', [url], { stdio: 'ignore' }), timeout = 600000) {
  const state = randomBytes(32).toString('hex'), path = `/authorize/${randomBytes(24).toString('hex')}`;
  let accepted = false, timer, finish;
  const result = new Promise((resolve, reject) => { finish = { resolve, reject }; });
  const server = createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'");
    if (accepted || req.method !== 'GET') { res.writeHead(410); res.end('Closed'); return; }
    let value;
    try { value = parseCallback(req.url, path, state, discovery.site); }
    catch (e) {
      res.writeHead(400); res.end('Authorization not accepted. Return to the helper.');
      if (e.code === 'owner-declined') { accepted = true; finish.reject(e); }
      return;
    }
    accepted = true;
    try {
      // Save recoverable metadata first, then the credential before API calls/output.
      const record = { ...discovery, user: value.user, created_at: new Date().toISOString(), cleanup: 'pending' };
      store.save(record); store.put(value.user, value.password);
      res.end('<script>history.replaceState(null,"","/")</script>Access received. You may close this tab.', () => finish.resolve(record));
    } catch (e) { res.writeHead(500); res.end('Local storage failed. Revoke MoonPress Chat installation in WordPress.'); finish.reject(e); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const callback = new URL(`http://127.0.0.1:${server.address().port}${path}`); callback.searchParams.set('state', state);
  const url = new URL(discovery.authorization_url);
  url.searchParams.set('app_name', 'MoonPress Chat installation'); url.searchParams.set('app_id', BOOTSTRAP_APP_ID);
  url.searchParams.set('success_url', callback.href); url.searchParams.set('reject_url', callback.href + '&success=false');
  timer = setTimeout(() => finish.reject(cleanError('authorization-timeout')), timeout);
  try {
    const opened = opener(url.href);
    if (opened?.status !== 0) throw cleanError('browser-open-failed');
    return await result;
  } finally { clearTimeout(timer); server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
}

export async function runBootstrap(site, options, deps) {
  const discovery = await discover(site, deps.fetcher);
  const store = deps.store;
  if (store.read()) throw cleanError('cleanup-existing-bootstrap-first');
  const record = await deps.authorize(discovery, store);
  let call, outcome, failure;
  try {
    call = makeClient(record, store.get(), deps.fetcher);
    const identity = await call('GET', '/wp/v2/users/me/application-passwords/introspect');
    if (identity?.app_id !== BOOTSTRAP_APP_ID || !UUID.test(identity?.uuid || '')) throw cleanError('credential-identity-mismatch');
    record.uuid = identity.uuid; store.save(record);
    outcome = await installOrInspect(call, options);
  } catch (e) { failure = e.code || 'bootstrap-failed'; }
  const cleanup = call ? await revoke(record, call, store.save, store.remove)
    : { server_revoked: false, cleanup_pending: true, cleanup_reason: 'credential-read-failed' };
  if (!call) { record.cleanup = 'pending'; store.save(record); }
  return { ...(outcome || {}), ...(failure ? { error: failure } : {}), ...cleanup, ready_for_scoped_setup: !failure && !cleanup.cleanup_pending && outcome?.after === 'active' };
}

async function main() {
  const [command, rawSite, ...flags] = process.argv.slice(2);
  if (!['inspect', 'bootstrap', 'cleanup'].includes(command) || !rawSite || flags.some((x) => !['--install', '--activate-owner-confirmed'].includes(x)) || (command !== 'bootstrap' && flags.length)) throw cleanError('usage-inspect-or-bootstrap-or-cleanup-site');
  if (process.platform !== 'darwin') throw cleanError('credential-backend-unsupported');
  const site = normalizeSite(rawSite);
  // Not enabled by the released public flow until independent WordPress acceptance.
  // Cleanup remains available without the gate so a disabled experiment is recoverable.
  if (command !== 'cleanup' && process.env.MOONPRESSCHAT_BOOTSTRAP_EXPERIMENTAL !== '1') throw cleanError('experimental-bootstrap-disabled');
  const store = localStore(site);
  if (command === 'cleanup') {
    const record = store.read();
    if (!record || record.site !== site) throw cleanError('bootstrap-record-unavailable');
    const call = record.cleanup === 'server-revoked' ? null : makeClient(record, store.get());
    const result = await revoke(record, call, store.save, store.remove);
    process.stdout.write(JSON.stringify(result) + '\n'); process.exitCode = result.cleanup_pending ? 1 : 0; return;
  }
  process.stderr.write('Approve WordPress installation access in your browser. This separate credential inherits administrator permissions; the helper revokes it after the bounded operation. It is not the restricted setup credential.\n');
  const result = await runBootstrap(site, { install: flags.includes('--install'), activate: flags.includes('--activate-owner-confirmed') }, { fetcher: fetch, store, authorize });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exitCode = result.error || result.cleanup_pending ? 1 : 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { process.stderr.write(`${/^[a-z0-9-]+$/.test(e.code || '') ? e.code : 'bootstrap-failed'}\n`); process.exitCode = 1; });
}
