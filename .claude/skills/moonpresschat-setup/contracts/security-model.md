# Security model

## Trust boundaries

| Data | Human entry point | Agent may observe |
|---|---|---|
| WordPress account password | WordPress login page | No |
| WordPress Application Password | Local callback helper (`helper/moonpresschat-setup-helper.mjs`, shipped) | Status only |
| AI-provider key | Helper `provider` subcommand (TTY, echo off) or write-only MoonPress Chat settings UI | `has_key` and test status |
| moonpresschat.com account credential | moonpresschat.com login/consent page | Authorization status only |
| moonpresschat.com scoped token | OS credential helper | Scope and expiry only |
| License key | MoonPress Chat entitlement flow | Masked status only |

On the API path, the helper is the only component that bridges non-secret,
agent-authored configuration and authenticated HTTP: paths resolve against the
`rest_url` recorded at connect time, absolute URLs and paths outside `/setup`
are refused, and `PUT /setup/provider` is unreachable through the generic
bridge. In guided mode, the agent observes none of the authenticated UI. On
either path the human may report non-secret state such as
`provider test passed`, `preset applied`, or `visibility off`.

## Storage

| Platform | State | Backend |
|---|---|---|
| macOS | Shipped (helper) | Keychain generic password item `moonpresschat-setup:<origin-slug>`, written by `security add-generic-password -U`, read by `find-generic-password -w`, removed on disconnect |
| Windows | Unsupported — helper exits `credential-backend-unsupported`; route to the guided path | Credential Manager has no built-in secret-retrieval CLI; a researched backend lands in a later version |
| Linux | Unsupported until a documented OS-native backend is approved; guided path | — |

- Non-secret connection record: `~/.moonpresschat-setup/<origin-slug>.json` (origin,
  `rest_url`, `user_login`, connected-at, connection policy) — never a
  credential.
- Project artifacts: non-secret configuration and evidence only.

## Browser boundary

The skill may open the user's default browser for a documented login or consent
URL. It must not click, type, read the DOM, capture screenshots, attach to an
existing session, or extract cookies. The human completes the flow.

The helper's loopback callback listener binds only 127.0.0.1 on a random port
with an unguessable path and `state`, serves no third-party asset, sends
`Cache-Control: no-store` and `Referrer-Policy: no-referrer`, accepts one
terminal callback, stores the credential before producing any output, and
strips the query from browser history.

During a guided run, the human opens and operates wp-admin. Do not ask them to
stream, share, or screenshot the authenticated session.

## WordPress boundary

- Core Application Password consent, not the normal password.
- The setup credential is confined by the plugin to `moonpresschat/v1/setup` and
  every operation requires `manage_options`; its lifetime is enforced
  server-side (30-minute idle, two-hour hard maximum, revoked on go-live).
- HTTPS only outside loopback development.
- Exact-origin validation before authorization and every API call — the helper
  requires the compatibility payload's `site_url` to equal the supplied origin.
- No XML-RPC, SSH, database, filesystem, or generic administrator automation.
- Plugin packages come only from a verified official distribution. The agent
  never invents a package URL or uploads an arbitrary ZIP.
- Production changes require a human-confirmed restorable backup and recorded
  rollback path. Failed public behavior is disabled before troubleshooting.

## Logging and artifacts

- Remove query strings from authorization URLs before recording them.
- Record HTTP status and public error code, not response bodies that may contain
  credentials. The helper redacts stored secrets from all of its error output.
- Redact emails unless they are necessary for the approved configuration.
- Never include raw headers, cookies, reset links, secrets, or tokens.
