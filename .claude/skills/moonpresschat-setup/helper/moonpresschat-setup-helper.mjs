#!/usr/bin/env node
/*
 * moonpresschat-setup-helper.mjs — the local credential helper for the moonpresschat-setup skill.
 *
 * This single-file script is the only component that ever touches the
 * WordPress Application Password minted for the MoonPress Chat setup API
 * (namespace moonpresschat/v1/setup, API version 1.0; MoonPress Chat 5.0.0 or
 * newer — older plugins register only the pre-5.0.0 namespace, answer 404 on
 * compatibility, and route to the skill's guided path). The agent composes
 * non-secret JSON and calls this helper; the helper authenticates.
 *
 * Security contract:
 *   1. The Application Password lives only in the macOS Keychain; it is never
 *      printed, logged, echoed, or written to any file.
 *   2. Request paths are resolved against the rest_url recorded at connect
 *      time; absolute URLs and paths outside /setup are refused.
 *   3. The provider API key is typed on this helper's own TTY with echo off
 *      and sent once; it never exists in argv, a file, or the transcript.
 *   4. Request bodies are read from files, never from argv; all error output
 *      is redacted against stored secrets before printing.
 *   5. PUT /setup/provider is unreachable through the generic `call` bridge —
 *      the secret channel is the `provider` subcommand only.
 *
 * Usage:
 *   node moonpresschat-setup-helper.mjs connect <origin>
 *   node moonpresschat-setup-helper.mjs status <origin>
 *   node moonpresschat-setup-helper.mjs call <origin> <METHOD> </setup/...> [--body <file>] [--idempotency-key <key>]
 *   node moonpresschat-setup-helper.mjs provider <origin> <provider-id> <model>
 *   node moonpresschat-setup-helper.mjs disconnect <origin>
 *
 * Exit codes: 0 = success (HTTP 2xx), 1 = HTTP or contract failure,
 * 2 = usage or platform error (including credential-backend-unsupported).
 *
 * Requires Node.js >= 22.20. Credential backend: macOS Keychain via the
 * `security` CLI. On any other platform the helper exits 2 with
 * `credential-backend-unsupported`; use the skill's guided path there.
 */

import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync, chmodSync } from 'node:fs';

const API_VERSION = '1.0';
const REST_NAMESPACE = 'moonpresschat/v1'; // MoonPress Chat 5.0.0+; 4.8.0 and older speak a different namespace
const IDEMPOTENCY_HEADER = 'X-MoonPressChat-Setup-Idempotency-Key';
const REQUIRED_CAPABILITIES = [
	'status', 'validate', 'apply', 'verify', 'rollback',
	'go_live', 'provider_write', 'self_revoke',
];
const SETUP_PREFIX = '/setup';
const AUTH_WAIT_MS = 10 * 60 * 1000; // how long connect waits for the browser callback
const HTTP_TIMEOUT_MS = 120000;      // provider tests can legitimately take ~25s
const COMPAT_TIMEOUT_MS = 30000;

/* Secrets seen during this process, so error output can be scrubbed. */
const secrets = [];

function redact( text ) {
	let out = String( text );
	for ( const secret of secrets ) {
		if ( secret ) {
			out = out.split( secret ).join( '[redacted]' );
		}
	}
	return out;
}

function fail( exitCode, message ) {
	process.stderr.write( redact( message ) + '\n' );
	process.exit( exitCode );
}

function note( message ) {
	process.stderr.write( redact( message ) + '\n' );
}

function printResult( value ) {
	process.stdout.write( redact( JSON.stringify( value, null, 2 ) ) + '\n' );
}

/* --------------------------------------------------------------------------
 * Platform gate — macOS Keychain is the only supported credential backend.
 * ------------------------------------------------------------------------ */

if ( process.platform !== 'darwin' ) {
	fail( 2, 'credential-backend-unsupported: this helper stores credentials only in the macOS Keychain; use the moonpresschat-setup guided path on this platform.' );
}

/* --------------------------------------------------------------------------
 * Origin handling
 * ------------------------------------------------------------------------ */

function isLocalHostname( hostname ) {
	const h = hostname.toLowerCase();
	return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]'
		|| h.endsWith( '.localhost' ) || h.endsWith( '.local' ) || h.endsWith( '.test' );
}

/** Normalize an owner-supplied origin: scheme + host (+ optional subdirectory path), no trailing slash. */
function normalizeOrigin( input ) {
	let url;
	try {
		url = new URL( String( input ) );
	} catch {
		fail( 2, `Not a valid URL: ${input}` );
	}
	if ( url.protocol !== 'https:' && url.protocol !== 'http:' ) {
		fail( 2, `Unsupported scheme: ${url.protocol}` );
	}
	if ( url.protocol === 'http:' && ! isLocalHostname( url.hostname ) ) {
		fail( 2, 'HTTPS is required outside local development environments.' );
	}
	if ( url.username || url.password ) {
		fail( 2, 'Do not embed credentials in the origin URL.' );
	}
	const path = url.pathname.replace( /\/+$/, '' );
	return url.origin + path;
}

function originSlug( normalized ) {
	return normalized
		.replace( /^[a-z]+:\/\//i, '' )
		.toLowerCase()
		.replace( /[^a-z0-9.]+/g, '-' )
		.replace( /^-+|-+$/g, '' );
}

/* --------------------------------------------------------------------------
 * Keychain (macOS `security` CLI)
 * ------------------------------------------------------------------------ */

function keychainService( slug ) {
	return `moonpresschat-setup:${slug}`;
}

function securityEscape( value ) {
	return String( value ).replace( /\\/g, '\\\\' ).replace( /"/g, '\\"' );
}

/**
 * Store the credential. The secret is fed through `security -i` on stdin so
 * it never appears in this process's argv (visible via process listings).
 */
function keychainAdd( service, account, secret ) {
	if ( /[\r\n]/.test( account ) || /[\r\n]/.test( secret ) ) {
		return false; // fail closed on values the interactive parser cannot carry
	}
	const line = `add-generic-password -U -s "${securityEscape( service )}" -a "${securityEscape( account )}" -w "${securityEscape( secret )}"\n`;
	const run = spawnSync( 'security', [ '-i' ], { input: line, encoding: 'utf8' } );
	return run.status === 0;
}

function keychainFind( service ) {
	const run = spawnSync( 'security', [ 'find-generic-password', '-s', service, '-w' ], { encoding: 'utf8' } );
	if ( run.status !== 0 ) {
		return null;
	}
	const secret = run.stdout.replace( /\n$/, '' );
	return secret === '' ? null : secret;
}

/** Returns true when the item is gone (deleted now or already absent). */
function keychainDelete( service ) {
	const run = spawnSync( 'security', [ 'delete-generic-password', '-s', service ], { encoding: 'utf8' } );
	if ( run.status === 0 ) {
		return true;
	}
	return /could not be found/i.test( `${run.stdout}\n${run.stderr}` );
}

/* --------------------------------------------------------------------------
 * Non-secret connection record: ~/.moonpresschat-setup/<origin-slug>.json
 * ------------------------------------------------------------------------ */

function recordDir() {
	const home = process.env.HOME;
	if ( ! home ) {
		fail( 2, 'HOME is not set; cannot locate ~/.moonpresschat-setup.' );
	}
	return `${home}/.moonpresschat-setup`;
}

function recordPath( slug ) {
	return `${recordDir()}/${slug}.json`;
}

function saveRecord( slug, record ) {
	const dir = recordDir();
	mkdirSync( dir, { recursive: true, mode: 0o700 } );
	const path = recordPath( slug );
	writeFileSync( path, JSON.stringify( record, null, 2 ) + '\n', { mode: 0o600 } );
	chmodSync( path, 0o600 );
}

function loadRecord( slug ) {
	const path = recordPath( slug );
	if ( ! existsSync( path ) ) {
		return null;
	}
	try {
		return JSON.parse( readFileSync( path, 'utf8' ) );
	} catch {
		return null;
	}
}

/* --------------------------------------------------------------------------
 * HTTP
 * ------------------------------------------------------------------------ */

async function httpJson( url, { method = 'GET', headers = {}, body = null, timeout = HTTP_TIMEOUT_MS } = {} ) {
	let response;
	try {
		response = await fetch( url, {
			method,
			headers,
			body,
			redirect: 'manual', // an unexpected redirect is an abort condition, not something to follow
			signal: AbortSignal.timeout( timeout ),
		} );
	} catch ( error ) {
		return { ok: false, status: 0, body: { error: 'network_error', message: redact( error && error.message ? error.message : String( error ) ) } };
	}
	if ( response.status >= 300 && response.status < 400 ) {
		return { ok: false, status: response.status, body: { error: 'unexpected_redirect', message: 'The server answered with a redirect; refusing to follow it.' } };
	}
	const text = await response.text();
	let parsed;
	try {
		parsed = JSON.parse( text );
	} catch {
		parsed = { raw: redact( text ).slice( 0, 4000 ) };
	}
	return { ok: response.status >= 200 && response.status < 300, status: response.status, body: parsed };
}

function basicAuth( userLogin, password ) {
	return 'Basic ' + Buffer.from( `${userLogin}:${password}` ).toString( 'base64' );
}

/** GET /setup/compatibility — pretty permalinks first, ?rest_route= fallback. */
async function fetchCompatibility( origin ) {
	const pretty = await httpJson( `${origin}/wp-json/${REST_NAMESPACE}/setup/compatibility`, { timeout: COMPAT_TIMEOUT_MS } );
	if ( pretty.ok && pretty.body && typeof pretty.body.api_version === 'string' ) {
		return pretty;
	}
	const fallback = await httpJson( `${origin}/?rest_route=/${REST_NAMESPACE}/setup/compatibility`, { timeout: COMPAT_TIMEOUT_MS } );
	if ( fallback.ok && fallback.body && typeof fallback.body.api_version === 'string' ) {
		return fallback;
	}
	return pretty.ok ? pretty : fallback;
}

/* --------------------------------------------------------------------------
 * Authenticated call plumbing shared by status/call/provider/disconnect
 * ------------------------------------------------------------------------ */

function requireConnection( origin ) {
	const normalized = normalizeOrigin( origin );
	const slug = originSlug( normalized );
	const record = loadRecord( slug );
	if ( ! record || ! record.rest_url || ! record.user_login ) {
		fail( 2, `Not connected to ${normalized}. Run: connect ${normalized}` );
	}
	const secret = keychainFind( keychainService( slug ) );
	if ( ! secret ) {
		fail( 2, `No stored credential for ${normalized}. Run: connect ${normalized}` );
	}
	secrets.push( secret );
	return { normalized, slug, record, secret };
}

/**
 * Resolve a /setup/... path against the rest_url the compatibility payload
 * advertised at connect time. Works for both pretty permalinks
 * (…/wp-json/moonpresschat/v1/setup) and the ?rest_route= form
 * (…/?rest_route=/moonpresschat/v1/setup) because both concatenate correctly.
 */
function resolveSetupPath( record, path ) {
	return record.rest_url.replace( /\/$/, '' ) + path.slice( SETUP_PREFIX.length );
}

async function setupRequest( conn, method, path, bodyText, idempotencyKey ) {
	const headers = {
		Authorization: basicAuth( conn.record.user_login, conn.secret ),
		Accept: 'application/json',
	};
	if ( bodyText !== null && bodyText !== undefined ) {
		headers[ 'Content-Type' ] = 'application/json';
	}
	if ( idempotencyKey ) {
		headers[ IDEMPOTENCY_HEADER ] = idempotencyKey;
	}
	return httpJson( resolveSetupPath( conn.record, path ), { method, headers, body: bodyText ?? null } );
}

/* --------------------------------------------------------------------------
 * Hidden TTY input (provider key)
 * ------------------------------------------------------------------------ */

function readHidden( prompt ) {
	return new Promise( ( resolve ) => {
		if ( ! process.stdin.isTTY ) {
			fail( 2, 'The provider key must be typed on an interactive terminal; refusing to read it from a pipe or file.' );
		}
		process.stderr.write( prompt );
		const stdin = process.stdin;
		stdin.resume();
		stdin.setRawMode( true );
		stdin.setEncoding( 'utf8' );
		let value = '';
		const onData = ( chunk ) => {
			for ( const ch of chunk ) {
				if ( ch === '\r' || ch === '\n' ) {
					stdin.setRawMode( false );
					stdin.pause();
					stdin.removeListener( 'data', onData );
					process.stderr.write( '\n' );
					resolve( value );
					return;
				}
				if ( ch === '\u0003' ) { // Ctrl-C
					stdin.setRawMode( false );
					process.stderr.write( '\n' );
					process.exit( 2 );
				}
				if ( ch === '\u007f' || ch === '\b' ) {
					value = value.slice( 0, -1 );
					continue;
				}
				value += ch;
			}
		};
		stdin.on( 'data', onData );
	} );
}

/* --------------------------------------------------------------------------
 * connect <origin>
 * ------------------------------------------------------------------------ */

async function cmdConnect( origin ) {
	const normalized = normalizeOrigin( origin );
	const slug = originSlug( normalized );

	// 1. Compatibility gate.
	const compat = await fetchCompatibility( normalized );
	if ( ! compat.ok || ! compat.body || typeof compat.body !== 'object' ) {
		printResult( { connected: false, reason: 'compatibility-unreachable', status: compat.status, body: compat.body } );
		process.exit( 1 );
	}
	const payload = compat.body;
	if ( payload.available !== true ) {
		printResult( { connected: false, reason: 'unavailable', unavailable_reason: String( payload.unavailable_reason ?? '' ), plugin_version: payload.plugin_version ?? null } );
		process.exit( 1 );
	}
	const schemaVersions = Array.isArray( payload.schema_versions ) ? payload.schema_versions : [];
	if ( ! schemaVersions.includes( API_VERSION ) ) {
		printResult( { connected: false, reason: 'unsupported-api-version', schema_versions: schemaVersions } );
		process.exit( 1 );
	}
	const capabilities = Array.isArray( payload.capabilities ) ? payload.capabilities : [];
	const missing = REQUIRED_CAPABILITIES.filter( ( cap ) => ! capabilities.includes( cap ) );
	if ( missing.length ) {
		printResult( { connected: false, reason: 'missing-capabilities', missing } );
		process.exit( 1 );
	}
	if ( typeof payload.site_url !== 'string' || normalizeOrigin( payload.site_url ) !== normalized ) {
		printResult( { connected: false, reason: 'origin-mismatch', supplied: normalized, reported: payload.site_url ?? null } );
		process.exit( 1 );
	}
	if ( typeof payload.rest_url !== 'string' || ! payload.rest_url || ! payload.authorization_url || ! payload.application || ! payload.application.id ) {
		printResult( { connected: false, reason: 'incomplete-compatibility-payload' } );
		process.exit( 1 );
	}

	const policy = ( payload.connection && typeof payload.connection === 'object' ) ? payload.connection : {};
	const hardMinutes = Math.round( ( Number( policy.max_lifetime ) || 0 ) / 60 );
	const idleMinutes = Math.round( ( Number( policy.idle_timeout ) || 0 ) / 60 );
	note( `Connection policy: hard lifetime ${hardMinutes || '?'} min (the whole setup run must finish inside it), idle timeout ${idleMinutes || '?'} min, revoked on go-live: ${policy.revoked_on_go_live === true}.` );

	// 2. Loopback listener with random port, unguessable path, and state.
	const token = randomBytes( 16 ).toString( 'hex' );
	const state = randomBytes( 16 ).toString( 'hex' );
	const successPath = `/${token}/success`;
	const rejectPath = `/${token}/reject`;

	const closeTabPage = '<!doctype html><meta charset="utf-8"><title>MoonPress Chat setup</title>' +
		'<script>try{history.replaceState(null,"",location.pathname)}catch(e){}</script>' +
		'<p style="font:16px/1.5 system-ui;margin:3em auto;max-width:32em;text-align:center">' +
		'Done. You can close this tab and return to the terminal.</p>';

	const outcome = await new Promise( ( resolve ) => {
		let settled = false;
		const settle = ( result ) => {
			if ( ! settled ) {
				settled = true;
				clearTimeout( timer );
				server.close();
				resolve( result );
			}
		};
		const stateMatches = ( candidate ) => {
			const a = Buffer.from( String( candidate ?? '' ) );
			const b = Buffer.from( state );
			return a.length === b.length && timingSafeEqual( a, b );
		};
		const server = createServer( ( req, res ) => {
			const url = new URL( req.url, 'http://127.0.0.1' );
			res.setHeader( 'Cache-Control', 'no-store' );
			res.setHeader( 'Referrer-Policy', 'no-referrer' );
			res.setHeader( 'Content-Type', 'text/html; charset=utf-8' );
			if ( url.pathname !== successPath && url.pathname !== rejectPath ) {
				res.statusCode = 404;
				res.end( 'Not found' );
				return;
			}
			if ( settled ) {
				res.statusCode = 410;
				res.end( 'This callback has already been used.' );
				return;
			}
			if ( ! stateMatches( url.searchParams.get( 'state' ) ) ) {
				res.statusCode = 400;
				res.end( 'Invalid state. Close this tab.' );
				settle( { kind: 'bad-state' } );
				return;
			}
			if ( url.pathname === rejectPath ) {
				res.statusCode = 200;
				res.end( closeTabPage );
				settle( { kind: 'rejected' } );
				return;
			}
			const userLogin = url.searchParams.get( 'user_login' ) || '';
			const password = url.searchParams.get( 'password' ) || '';
			if ( ! userLogin || ! password ) {
				res.statusCode = 400;
				res.end( 'Missing credential in callback. Close this tab.' );
				settle( { kind: 'bad-callback' } );
				return;
			}
			// Store BEFORE producing any output — the credential must be at
			// rest in the Keychain before anything else happens.
			secrets.push( password );
			const stored = keychainAdd( keychainService( slug ), userLogin, password );
			if ( ! stored ) {
				res.statusCode = 500;
				res.end( 'Could not store the credential. Close this tab.' );
				settle( { kind: 'store-failed' } );
				return;
			}
			res.statusCode = 200;
			res.end( closeTabPage );
			settle( { kind: 'success', userLogin } );
		} );
		const timer = setTimeout( () => settle( { kind: 'timeout' } ), AUTH_WAIT_MS );
		server.listen( 0, '127.0.0.1', () => {
			const { port } = server.address();
			const successUrl = `http://127.0.0.1:${port}${successPath}?state=${state}`;
			const rejectUrl = `http://127.0.0.1:${port}${rejectPath}?state=${state}`;
			const authUrl = payload.authorization_url +
				( payload.authorization_url.includes( '?' ) ? '&' : '?' ) +
				`app_name=${encodeURIComponent( payload.application.name || 'MoonPress Chat setup' )}` +
				`&app_id=${encodeURIComponent( payload.application.id )}` +
				`&success_url=${encodeURIComponent( successUrl )}` +
				`&reject_url=${encodeURIComponent( rejectUrl )}`;
			note( 'Opening the WordPress authorization page in your browser. Sign in and approve "MoonPress Chat setup".' );
			note( `If the browser did not open, visit:\n${authUrl}` );
			spawnSync( 'open', [ authUrl ], { stdio: 'ignore' } );
		} );
	} );

	switch ( outcome.kind ) {
		case 'rejected':
			fail( 1, 'Authorization was rejected by the owner.' );
			break;
		case 'bad-state':
			fail( 1, 'Callback state mismatch; nothing was stored. Run connect again.' );
			break;
		case 'bad-callback':
			fail( 1, 'The callback carried no credential; nothing was stored.' );
			break;
		case 'store-failed':
			fail( 2, 'The macOS Keychain refused the credential write.' );
			break;
		case 'timeout':
			fail( 1, 'Timed out waiting for the authorization callback; nothing was stored.' );
			break;
	}

	// 3. Persist the non-secret connection record.
	const record = {
		origin: normalized,
		rest_url: payload.rest_url,
		user_login: outcome.userLogin,
		connected_at: new Date().toISOString(),
		policy,
	};
	saveRecord( slug, record );

	// 4. Smoke test: GET /setup/status.
	const conn = { normalized, slug, record, secret: keychainFind( keychainService( slug ) ) };
	if ( ! conn.secret ) {
		fail( 2, 'The credential was stored but could not be read back from the Keychain.' );
	}
	secrets.push( conn.secret );
	const smoke = await setupRequest( conn, 'GET', '/setup/status', null, null );

	printResult( {
		connected: true,
		origin: normalized,
		rest_url: payload.rest_url,
		user_login: outcome.userLogin,
		connected_at: record.connected_at,
		policy,
		smoke: { status: smoke.status, ok: smoke.ok },
	} );
	process.exit( smoke.ok ? 0 : 1 );
}

/* --------------------------------------------------------------------------
 * status / call / provider / disconnect
 * ------------------------------------------------------------------------ */

async function cmdStatus( origin ) {
	const conn = requireConnection( origin );
	const result = await setupRequest( conn, 'GET', '/setup/status', null, null );
	printResult( { status: result.status, body: result.body } );
	process.exit( result.ok ? 0 : 1 );
}

async function cmdCall( origin, method, path, options ) {
	const conn = requireConnection( origin );
	method = String( method || '' ).toUpperCase();
	if ( ! [ 'GET', 'POST', 'PUT', 'DELETE' ].includes( method ) ) {
		fail( 2, `Unsupported method: ${method}` );
	}
	path = String( path || '' );
	if ( /^[a-z]+:\/\//i.test( path ) || path.startsWith( '//' ) ) {
		fail( 2, 'Absolute URLs are refused; pass a relative path starting with /setup.' );
	}
	if ( path !== SETUP_PREFIX && ! path.startsWith( SETUP_PREFIX + '/' ) ) {
		fail( 2, 'Only paths inside /setup are allowed.' );
	}
	if ( method === 'PUT' && path.replace( /\/+$/, '' ) === '/setup/provider' ) {
		fail( 2, 'PUT /setup/provider is refused here: use the provider subcommand, which reads the key on its own TTY.' );
	}

	let bodyText = null;
	if ( options.body !== undefined ) {
		try {
			bodyText = readFileSync( options.body, 'utf8' );
		} catch ( error ) {
			fail( 2, `Cannot read body file ${options.body}: ${error.message}` );
		}
	}

	let idempotencyKey = options.idempotencyKey;
	const needsKey = method === 'POST' && ( path === '/setup/apply' || path === '/setup/go-live' );
	if ( needsKey && ! idempotencyKey ) {
		idempotencyKey = randomBytes( 16 ).toString( 'hex' );
	}

	const result = await setupRequest( conn, method, path, bodyText, idempotencyKey );
	const envelope = { status: result.status };
	if ( idempotencyKey ) {
		envelope.idempotency_key = idempotencyKey;
	}
	envelope.body = result.body;
	printResult( envelope );
	process.exit( result.ok ? 0 : 1 );
}

async function cmdProvider( origin, providerId, model ) {
	if ( ! providerId || ! model ) {
		fail( 2, 'Usage: provider <origin> <provider-id> <model>' );
	}
	const conn = requireConnection( origin );
	const key = await readHidden( `Provider API key for ${providerId} (input is hidden): ` );
	if ( ! key ) {
		fail( 2, 'No key was entered.' );
	}
	secrets.push( key );
	const bodyText = JSON.stringify( { provider: providerId, model, key } );
	const result = await setupRequest( conn, 'PUT', '/setup/provider', bodyText, null );
	if ( result.ok && result.body && typeof result.body === 'object' ) {
		printResult( {
			provider: result.body.provider ?? providerId,
			model: result.body.model ?? model,
			configured: result.body.configured === true,
		} );
		process.exit( 0 );
	}
	printResult( { status: result.status, body: result.body } );
	process.exit( 1 );
}

async function cmdDisconnect( origin ) {
	const normalized = normalizeOrigin( origin );
	const slug = originSlug( normalized );
	const record = loadRecord( slug );
	const secret = keychainFind( keychainService( slug ) );
	let serverRevoked = null;
	if ( record && record.rest_url && record.user_login && secret ) {
		secrets.push( secret );
		const conn = { normalized, slug, record, secret };
		const result = await setupRequest( conn, 'DELETE', '/setup/connection', null, null );
		serverRevoked = result.ok && result.body && result.body.revoked === true;
	}
	// Delete the Keychain item regardless of the HTTP outcome — the server
	// may already have reaped the credential (idle/lifetime/go-live).
	const credentialRemoved = keychainDelete( keychainService( slug ) );
	if ( existsSync( recordPath( slug ) ) ) {
		unlinkSync( recordPath( slug ) );
	}
	printResult( { disconnected: true, server_revoked: serverRevoked, credential_removed: credentialRemoved } );
	process.exit( credentialRemoved ? 0 : 1 );
}

/* --------------------------------------------------------------------------
 * Argument parsing
 * ------------------------------------------------------------------------ */

const USAGE = `Usage:
  moonpresschat-setup-helper.mjs connect <origin>
  moonpresschat-setup-helper.mjs status <origin>
  moonpresschat-setup-helper.mjs call <origin> <METHOD> </setup/...> [--body <file>] [--idempotency-key <key>]
  moonpresschat-setup-helper.mjs provider <origin> <provider-id> <model>
  moonpresschat-setup-helper.mjs disconnect <origin>`;

async function main() {
	const argv = process.argv.slice( 2 );
	const command = argv.shift();
	switch ( command ) {
		case 'connect':
			if ( argv.length !== 1 ) fail( 2, USAGE );
			await cmdConnect( argv[ 0 ] );
			break;
		case 'status':
			if ( argv.length !== 1 ) fail( 2, USAGE );
			await cmdStatus( argv[ 0 ] );
			break;
		case 'call': {
			const positional = [];
			const options = {};
			for ( let i = 0; i < argv.length; i++ ) {
				if ( argv[ i ] === '--body' ) {
					options.body = argv[ ++i ];
					if ( options.body === undefined ) fail( 2, '--body requires a file path.' );
				} else if ( argv[ i ] === '--idempotency-key' ) {
					options.idempotencyKey = argv[ ++i ];
					if ( options.idempotencyKey === undefined ) fail( 2, '--idempotency-key requires a value.' );
				} else if ( argv[ i ].startsWith( '--' ) ) {
					fail( 2, `Unknown option: ${argv[ i ]}` );
				} else {
					positional.push( argv[ i ] );
				}
			}
			if ( positional.length !== 3 ) fail( 2, USAGE );
			await cmdCall( positional[ 0 ], positional[ 1 ], positional[ 2 ], options );
			break;
		}
		case 'provider':
			if ( argv.length !== 3 ) fail( 2, USAGE );
			await cmdProvider( argv[ 0 ], argv[ 1 ], argv[ 2 ] );
			break;
		case 'disconnect':
			if ( argv.length !== 1 ) fail( 2, USAGE );
			await cmdDisconnect( argv[ 0 ] );
			break;
		default:
			fail( 2, USAGE );
	}
}

main().catch( ( error ) => {
	fail( 2, `Unexpected failure: ${redact( error && error.stack ? error.stack : String( error ) )}` );
} );
