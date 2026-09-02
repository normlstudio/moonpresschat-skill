# Changelog

## 0.5.0 — 2026-09-02

- Moved the API path to the MoonPress Chat 1.0.0 contract. The plugin renamed
  every internal identifier in 1.0.0: REST namespace `moonpresschat/v1/setup`
  (`/wp-json/moonpresschat/v1/setup/...` and the
  `?rest_route=/moonpresschat/v1/setup/...` fallback), stable error codes
  `moonpresschat_setup_*`, and the idempotency header
  `X-MoonPressChat-Setup-Idempotency-Key` — updated in the helper, the API
  contract, and every action and contract document. The helper still
  resolves every `/setup/...` call against the `rest_url` the compatibility
  payload advertises.
- Documented the compatibility payload as a table, including the new stable
  machine id `plugin_slug: "moonpresschat"` beside the display label
  `plugin: "MoonPress Chat"`; identity keys on `plugin_slug`, never on the
  label. `api_version` `"1.0"`, envelope `schema_version` `"1.0"`, and the
  application id are unchanged.
- Recorded the renamed guided-path admin anchors — page slugs
  `admin.php?page=moonpresschat-*` (`moonpresschat-start`,
  `moonpresschat-analyze`, `moonpresschat-kb`, `moonpresschat-settings`) and
  `moonpresschat-*` DOM ids/classes — for recognizing URLs the human reads
  back; the guided sequence navigates by menu label and is otherwise
  unchanged.
- Raised the API-path floor to MoonPress Chat 1.0.0 or newer. The plugin
  restarted its version numbering with the new name; 4.8.0 was the last
  release under the old name. Against 4.8.0 or older,
  `GET .../moonpresschat/v1/setup/compatibility` answers 404 and the skill
  takes the guided path with `reason: plugin-predates-api`, exactly as when
  the API is unavailable.
- Compatibility matrix: skill 0.4.0 keeps working only with plugin 4.8.0 or
  older (old namespace); skill 0.5.0 pairs with plugin 1.0.0 or newer. Any
  other pairing falls back to the guided path.
- Unchanged: the `moonpresschat-setup` slug, the helper's Keychain service
  (`moonpresschat-setup:<origin-slug>`) and `~/.moonpresschat-setup/` record
  directory, the guided-path fallback logic, and all credential handling.

## 0.4.0 — 2026-09-01

- Repackaged the public release under
  `.claude/skills/moonpresschat-setup/`, with a repository-level README,
  validator, and one-skill install commands for Claude Code, Codex, and Gemini
  CLI.
- Added the package architecture to the generated human documentation and
  synchronized every public install example with the scoped
  `npx skills@latest` command.
- Prepared a reproducible release ZIP and checksum for the MoonPress Chat and
  Norml Studio website distribution surfaces.

## 0.3.2 — 2026-09-01

- Corrected the public GitHub owner slug to the verified `normlstudio/moonpresschat-skill` repository so the install command resolves for the newly published skill.

## 0.3.1 — 2026-09-01

- Forked the public setup workflow from Quip into the independent MoonPress Chat
  product identity: `moonpresschat-setup`, `Norml-Studio/moonpresschat-skill`,
  `moonpresschat.com`, and `helper/moonpresschat-setup-helper.mjs`.
- Isolated the helper's macOS Keychain service and non-secret local connection
  directory under the MoonPress Chat slug so the two products cannot share
  credentials or setup state accidentally.
- Preserved the inherited `quipbot/v1/setup` REST namespace as a compatibility
  contract; changing it requires a coordinated plugin and client migration.
- Kept the pre-fork changelog below verbatim as source-history evidence.

## 0.3.0 — 2026-09-01

- Made the shipped Quip Bot setup API (`quipbot/v1/setup`, API version 1.0)
  the default connect/configure/verify path, gated on the public
  `GET /setup/compatibility` payload (`available`, schema `"1.0"`, the base
  capability set) rather than a plugin version string; the guided wp-admin
  path remains as the documented fallback with an explicit recorded `reason`.
- Shipped the OS-native credential helper `helper/quip-setup-helper.mjs`:
  a single-file, zero-dependency Node.js (>= 22.20) ESM script with
  `connect`, `status`, `call`, `provider`, and `disconnect` subcommands;
  macOS Keychain storage, loopback Application Password consent, a closed
  `call` bridge locked to `/setup` paths (with `PUT /setup/provider` refused),
  file-only request bodies, auto-generated idempotency keys for apply and
  go-live, and a TTY echo-off prompt for the provider key. Windows and Linux
  exit `credential-backend-unsupported` and route to the guided path.
- Rewrote `contracts/current-api-contract.md` as the shipped-surface record:
  endpoint table (nine setup routes, four interview mirrors, public
  compatibility), the capability list, feature tiers (base API since 4.3.0,
  interview since 4.8.0), stable error codes, the connection lifetime policy
  (30-minute idle, two-hour hard maximum, revocation on go-live, site-wide
  revocation), the multisite refusal, and the fail-closed rules; removed the
  obsolete `iqb/v1` internal-surface description.
- Added the envelope flow to configure (validate → owner approval → apply
  with the server-returned `configuration_sha256`, optional rollback that
  never restores a provider secret) and the capability-gated interview stage
  (GET questions → owner answers in chat → PUT answers → GET preview → fold
  `preview.envelope` into the configuration envelope).
- Made `POST /setup/verify` drive the automated verification rows and go-live
  a separate `POST /setup/go-live` that revokes the connection
  (`connection_revoked`), with the API-path evidence map added to the QA
  checklist.
- Added the envelope mapping (verified against Quip Bot 4.8.0) beside the
  3.11.0 wp-admin label map, marked the macOS Keychain storage row shipped,
  and replaced the `automation: blocked-public-helper-and-api` state with
  `connection: api | guided-manual` plus a guided-only `reason`.

## 0.2.1 — 2026-08-22

- Standardized the public product name as **Quip Bot** throughout the skill,
  generated setup artifacts, agent metadata, and human documentation.
- Revalidated the installation and field-level guidance against the official
  Quip Bot 3.11.0 release and raised the documented compatibility floor.
- Preserved the `quip-setup` skill slug, `quip-skill` repository, `iqb` API
  namespace, and `quip.bot` domain as compatibility-sensitive identifiers.
- Migrated the legacy generic `references/` drawer to the descriptive
  `contracts/` folder and updated every workflow and human-doc cross-link.

## 0.2.0 — 2026-08-20

- Added the working human-guided wp-admin path so the skill can complete setup
  before the public automation API and credential helper ship.
- Added verified installation instructions using the open `npx skills` CLI.
- Mapped the current Quip Bot admin sequence across provider testing, Setup,
  Knowledge base, Templates, privacy, preview, and separate go-live approval.
- Kept authenticated browser control and secret handling human-owned while
  distinguishing guided setup from blocked direct automation.
- Reconciled the free-forever core, direct provider billing, and separate
  Quip Bot Pro license boundary from the Aug 19 product meeting.
- Closed the independent cold-start forward-test gaps: explicit opening gate,
  official-package installation path, version/runtime checks, staging vs.
  production decision, backup and rollback, a field-level 3.10.0 map, classified
  verification gates, and owner-supplied research provenance.
- Split readiness from go-live authorization, added the inactive-plugin route,
  normalized unresolved preflight states, expanded owner privacy/operations
  decisions, and made error/offline verification preserve write-only keys.

## 0.1.0 — 2026-08-17

- Added the five-stage Research → Questions → Connect → Configure → Verify
  workflow from the Quip Bot product discussion.
- Added public-site research, owner-answer, configuration-plan, and verification
  artifacts.
- Locked the security model: browser consent is human-operated, provider keys
  remain write-only in WordPress, and credentials never enter the AI transcript.
- Marked WordPress writes honestly blocked until the stable public Quip Bot setup API
  and OS-native connection helper are released.
- Kept the free Quip Bot setup independent from a quip.bot account or paid license.
