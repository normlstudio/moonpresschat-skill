# Action: connect WordPress safely

## Choose the path

Fetch the public `GET /setup/compatibility` endpoint (no authentication; try
`<origin>/wp-json/moonpresschat/v1/setup/compatibility`, then
`<origin>/?rest_route=/moonpresschat/v1/setup/compatibility`). A 404 from both
means the plugin is absent, inactive, or older than MoonPress Chat 5.0.0 (still
on the pre-5.0.0 namespace): guided path, `reason: plugin-predates-api`. Use
the API path only when **all** of the following hold — the helper re-checks
the same gate itself:

- `available: true`;
- `"1.0"` in `schema_versions`;
- capabilities include `status`, `validate`, `apply`, `verify`, `rollback`,
  `go_live`, `provider_write`, `self_revoke`;
- `site_url` equals the owner-supplied origin after normalization;
- the operator's machine is macOS (the helper's only credential backend in
  this release) and the owner agrees to run the helper.

Record the outcome in the configuration plan, together with the payload's
`plugin_slug` (`moonpresschat` — the stable machine id; the `plugin` label
is display-only) and `plugin_version`:

```yaml
connection: api | guided-manual
# guided-manual only — why the API path was not taken:
reason: multisite | plugin-predates-api | owner-declined-helper | credential-backend-unsupported
```

## Automated flow (shipped)

1. Validate the canonical WordPress origin and HTTPS (the helper enforces
   HTTPS outside local development hostnames).
2. Run the connect subcommand — the agent may run it; the human approves in
   their own browser:

   ```bash
   node helper/moonpresschat-setup-helper.mjs connect https://example.com
   ```

3. The helper fetches compatibility, applies the gate above, then starts a
   loopback-only listener (random 127.0.0.1 port, unguessable path and
   `state`) and opens WordPress core's Application Password authorization
   screen in the system browser. Nobody — helper or agent — reads or drives
   that browser.
4. The human signs in and approves or rejects the **MoonPress Chat setup**
   application request.
5. On approval, the helper validates the exact `state`, accepts one terminal
   callback only, stores the generated credential in the macOS Keychain
   **before producing any output**, serves a static close-tab page that strips
   the query from browser history, and closes the listener. On rejection, a
   wrong state, or a second callback it exits non-zero and stores nothing.
6. The helper writes the non-secret connection record to
   `~/.moonpresschat-setup/<origin-slug>.json` (origin, the advertised `rest_url`
   — `.../wp-json/moonpresschat/v1/setup` — `user_login`, `connected_at`,
   connection policy) and smoke-tests `GET /setup/status`.
7. Record only the redacted summary the helper prints: connection status,
   origin, user login, connected-at, policy, smoke result. Never the
   credential — the helper never prints it.

Warn the operator up front: the connection has a **two-hour hard lifetime**
(measured from credential creation — the whole run must finish inside it) and
a **30-minute idle timeout**. A mid-flow 401 means the connection expired or
was revoked; re-read compatibility and run `connect` again.

## Transcript boundary

- The agent may run `connect`, `status`, `call`, and `disconnect`. Their
  output is non-secret by construction.
- The `provider` subcommand must run in the **human's own interactive
  terminal**: it prompts for the provider key on its own TTY with echo off.
  Never ask for the key in chat, in a file, or as a command argument.
- Do not ask to see the browser, inspect the DOM, take over the session,
  receive a screenshot of authenticated wp-admin, or collect a credential in
  chat — on either path.

## Ending the connection

- A successful `POST /setup/go-live` revokes the connection itself
  (`connection_revoked`); do not run `disconnect` after it.
- When stopping early without going live, run:

  ```bash
  node helper/moonpresschat-setup-helper.mjs disconnect https://example.com
  ```

  It calls `DELETE /setup/connection`, then deletes the Keychain item
  regardless of the HTTP outcome (the server may already have reaped the
  credential). The plugin also enforces the idle/lifetime windows and a cron
  sweep on its own, so a crashed helper never leaves a usable credential
  behind.

## Guided flow (fallback)

1. Validate the canonical WordPress origin and HTTPS.
2. Confirm the user is already signed in to an authorized WordPress account in
   their own browser.
3. Record `connection: guided-manual` and the explicit `reason` in the
   configuration plan.
4. Follow `contracts/admin-guided-path.md` after the plan is approved.
5. The human performs every authenticated action and reports only non-secret
   state such as provider name, model, test passed/failed, and saved/not saved.

Do not fall back to a normal WordPress password, a credential pasted into the
terminal or chat, browser automation, SSH, or database access — the missing
API path blocks only direct agent writes, not the setup itself.

## Future MoonPress Chat authorization

The free core requires no moonpresschat.com account. A future device-authorization flow may
be added only for paid entitlements or managed services. It must use a browser
consent step and return a scoped token to the OS credential store without
exposing it to the agent. No such flow — and no `/license/*` operation — exists
in the shipped API.
