# Action: preflight and install MoonPress Chat

Complete this gate before public research or any WordPress configuration.

## Opening questions

Ask for and record these four items first:

1. The canonical public WordPress URL.
2. An explicit statement that the user owns the site or is authorized to manage
   it and approve the intended changes.
3. A writable local working directory. Create or reuse `moonpresschat-setup/` there.
4. Whether the target is staging or production. If both exist, configure and
   verify staging first.

Do not treat possession of an administrator login as proof of authority. Do not
pick an artifact directory without the user's confirmation unless the current
project directory is clearly the requested workspace; state the chosen path.

## Installation inventory

When the plugin is installed and the site is reachable, the public
compatibility endpoint answers the version and availability questions without
asking the human. Fetch (no authentication):

```text
GET <origin>/wp-json/moonpresschat/v1/setup/compatibility
GET <origin>/?rest_route=/moonpresschat/v1/setup/compatibility   # pretty-permalink fallback
```

It reports `plugin_slug` (`moonpresschat`), `plugin_version`,
`available`/`unavailable_reason`, `schema_versions`, `capabilities`,
`site_url`, `rest_url`, and the connection policy — record them and decide the
path per `actions/connect.md`. Ask the human only for what the payload cannot
answer: whether **MoonPress Chat** appears under **Plugins → Installed
Plugins** and which version, when the endpoint is unreachable (absent,
inactive, or older than 5.0.0 — those releases register only the pre-5.0.0
namespace `quipbot/v1`, so the URLs above answer 404), and the WordPress and
PHP versions from **Tools → Site Health → Info**.

Version 0.5.0 of this skill verifies the guided screen guidance against
MoonPress Chat 3.11.0 and the API contract against MoonPress Chat 5.0.0; the
API path requires 5.0.0 or newer. MoonPress Chat 5.0.0 renamed the plugin and
every internal identifier; 4.8.0 and older (released as QuipBot) register only
the old `quipbot/v1` namespace, so against them the compatibility URL answers
404 and the skill takes the guided path. The documented runtime floor is
WordPress 6.2 and PHP 7.4.

- MoonPress Chat 5.0.0 or newer with a passing compatibility gate: API path.
- MoonPress Chat 5.0.0 or newer without a passing gate (multisite, missing
  capability, origin mismatch, declined helper, unsupported backend): guided
  path (`connection: guided-manual` with its `reason`), not a blocker.
- A release from 3.11.0 through 4.8.0 (compatibility URL answers 404): guided
  path with `reason: plugin-predates-api`, not a blocker.
- A release older than 3.11.0: `compatibility: blocked-plugin-upgrade`.
- WordPress older than 6.2 or PHP older than 7.4:
  `compatibility: blocked-runtime`.
- On the guided path, a MoonPress Chat whose labels materially differ from the field
  map: stop the affected section and record
  `compatibility: blocked-guide-drift`.

Never request an authenticated screenshot.

## Human installation path

If MoonPress Chat is absent, follow `contracts/installation-and-rollback.md`. The
human installs and activates the plugin from a verified official distribution.
The agent does not upload the ZIP, operate wp-admin, or invent a download URL.

If MoonPress Chat is installed but inactive, the human activates the already-verified
installation from **Installed Plugins**. Record `installation: inactive` until
activation succeeds; do not continue to research/configuration while inactive.

After activation, the human confirms that the **MoonPress Chat** menu and **Setup** page
open. Record status, not authenticated page contents.

## Change-safety checkpoint

- Staging: record how the environment can be reset or restored.
- Production: require confirmation of a restorable site backup made before this
  setup. Record backup type, operator, and timestamp, never a download link or
  credential.
- Record the immediate-disable action: turn
  **Settings → Visibility → Make the bot live for visitors** off. If the admin
  UI itself is unavailable, the human may deactivate MoonPress Chat from Installed
  Plugins.

Write `moonpresschat-setup/preflight.md` from `templates/preflight.md`, using these
status values:

```yaml
authority: confirmed | unresolved | blocked
artifact_folder: /absolute/non-secret/path/moonpresschat-setup
environment: staging | production | unresolved
canonical_origin: https://example.com
installation: active | inactive | absent | blocked-official-package | unresolved
plugin_version: 5.0.0 | unknown
connection: api | guided-manual | unresolved
wordpress_version: value | unknown
php_version: value | unknown
compatibility: passed | unresolved | blocked-plugin-upgrade | blocked-runtime | blocked-guide-drift
backup_or_reset: confirmed | unresolved | blocked
rollback: confirmed | unresolved | blocked
visibility: off | on | unknown
```

Do not continue unless authority, artifact folder, environment, active
installation, compatibility, backup/reset path, rollback, and off visibility
are explicit and passed/confirmed. Visibility `unknown` is allowed only before
the plugin is installed; confirm it is off immediately after activation.
