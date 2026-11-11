# WordPress installation and setup handoff

Version 0.8.0 supports the bounded installation helper on macOS. Installation
uses the owner's native WordPress consent; it does not use the restricted setup
credential. Only run after the owner selects the site and authorizes setup.

## What installation does

`helper/wordpress-bootstrap.mjs` discovers the selected WordPress REST root,
opens the owner's native Application Password consent screen, stores the
credential in macOS Keychain, inventories the exact MoonPress Chat plugin, and
optionally installs or activates it. It never calls a provider, sends mail,
configures a license, or writes widget visibility options. Activation may restore
retained visibility, as described below.

This is a **different credential** from the existing setup credential. Core
WordPress Application Passwords inherit the approving user's capabilities;
the helper's allowlist is not server-enforced scope restriction. It requests
only the plugin inventory, exact official-directory MoonPress installation,
exact existing-plugin activation, and its own credential introspection/revoke.
The normal `/setup/*` helper and server namespace restrictions are unchanged.

The installation helper is macOS-only. Keep the existing human-guided route
for unsupported platforms, multisite, owner-declined access, host install
restrictions, incompatible runtime or unverified origin. No SSH/browser
control fallback.

## Authorized installation

Use the explicitly selected site. Production changes require the owner's
backup checkpoint and authority. Plan-only requests never run these commands.

```sh
node helper/wordpress-bootstrap.mjs inspect https://example.com
node helper/wordpress-bootstrap.mjs bootstrap https://example.com --install
```

`inspect` uses native owner consent for authenticated inventory, then revokes.
`--install` installs only an absent exact plugin with **status inactive** from
the WordPress.org directory slug `moonpresschat`. It does not update, replace,
or reinstall an existing plugin. Authentication failures and a compatibility
404 never count as proof of absence.

**Do not infer hidden state from absence in plugin inventory.** Old MoonPress
or legacy QuipBot options may survive deletion and may include `live=true`.
Activation could expose an old widget. The default command leaves the plugin
inactive. Once the owner has independently established the saved hidden state
on the selected site, explicit activation is available:

```sh
node helper/wordpress-bootstrap.mjs bootstrap https://example.com --activate-owner-confirmed
```

The flag records the caller's decision; it does not prove visibility. Output
therefore reports `visibility: unverified`. It is not permitted as a shortcut
for an unknown inactive installation. Unknown state goes to the existing
human-guided activation path. There is no preactivation API proving saved visibility. When it cannot be
verified from the owner's known installation/reset state, the owner must activate
and confirm hidden visibility in WordPress before automated setup continues.

After `ready_for_scoped_setup: true` and `server_revoked: true`, the agent
continues with the existing helper without asking the owner to issue a new
command:

```sh
node helper/moonpresschat-setup-helper.mjs preflight https://example.com
node helper/moonpresschat-setup-helper.mjs connect https://example.com
node helper/moonpresschat-setup-helper.mjs status https://example.com
```

Native consent for the separate scoped setup connection is unavoidable. Verify
visibility from this status before any provider or widget test. Preserve an
existing installation's settings and visibility; no general settings write is
part of bootstrap. Continue the existing interview → preview → validate →
reviewed apply → verify → disconnect workflow. No automatic go-live.

The free path requires no MoonPress account or license. `/license/*` and
`pro_activation` remain absent; report paid activation unsupported while free
setup may proceed.

## Credential cleanup and recovery

The distinct app id is `1ac8286c-9f52-4c8d-b383-0db667e4a820`, display name
**MoonPress Chat installation**. The Keychain service is
`moonpresschat-bootstrap:<sha256-of-site>`. Non-secret records live in
`~/.moonpresschat-setup/bootstrap/` with site, REST mode, owner login, UUID and
cleanup state. The password never enters files, command arguments or output.

The helper introspects the authenticated credential and verifies its app id
before deleting **only that UUID**. Server errors leave the secret and a
cleanup-pending record available for retry; a new bootstrap refuses to overwrite
that record. Cleanup can be run independently of installation:

```sh
node helper/wordpress-bootstrap.mjs cleanup https://example.com
```

Core credentials do not have the setup plugin's two-hour/idle expiry. Never
claim automatic server expiry. If cleanup cannot be confirmed, stop further
setup, report the pending state and ask the owner to revoke **MoonPress Chat
installation** in their WordPress profile's Application Passwords. Do not ask
for credentials or an authenticated screenshot. Keychain storage failure after
consent also requires this manual revocation. A server-confirmed revocation
with failed local deletion retries only local cleanup, without another secret.

## Verification boundaries

Pure/loopback tests cover allowed paths, callback state/site, no cross-origin
redirects, absent/active/inactive inventory, no option mutations, explicit
activation, errors and cleanup. They do not prove WordPress filesystem access,
real browser consent, Keychain success, local WordPress activation defaults,
provider behavior, mail delivery or customer launch readiness. Real WordPress REST installation, reuse, explicit activation, cleanup and scoped
setup were also exercised on a disposable fixture with plugin 5.11.0. Fixture
credentials are not evidence of a fresh native browser consent or Desktop
automatic-update run. Do not infer customer readiness from those checks.

Official contracts: [Plugins REST API](https://developer.wordpress.org/rest-api/reference/plugins/)
and [Application Password authentication](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/).
