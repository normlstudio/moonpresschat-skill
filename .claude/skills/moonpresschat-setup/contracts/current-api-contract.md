# Current MoonPress Chat API contract

## Shipped public setup surface

MoonPress Chat ships a stable public setup API. This document is the client-side
record of that surface as verified against MoonPress Chat 4.8.0; the base API shipped
in 4.3.0.

- Namespace: `quipbot/v1/setup` (the pre-4.x internal `iqb/v1` namespace no
  longer exists on current plugins and is not part of any contract).
- API version: `1.0` (also the only entry in `schema_versions`).
- Content type: `application/json`. Every response is
  `Cache-Control: no-store, private`.
- Request body ceilings: 512 KiB general; 16 KiB for the provider-secret body
  (`PUT /setup/provider`); 64 KiB for interview answers.
- Authentication: a temporary WordPress Application Password minted through
  core's consent screen for the stable application identity
  `MoonPress Chat setup` / app id `c8d4bd65-7694-4c34-b8cd-4d54b44b389e`, sent as
  HTTPS Basic Auth. The plugin confines that credential to this namespace and
  every operation additionally requires `manage_options`.

The plugin's internal admin routes (`quipbot/v1/admin/*`) remain outside the
contract. The setup credential cannot reach them: authentication fails with
`quipbot_setup_scope_denied`. The skill never calls them.

## Endpoints

| Method | Path | Authentication | Purpose |
|---|---|---|---|
| GET | `/setup/compatibility` | Public | Negotiate availability, versions, capabilities; build the authorization URL |
| GET | `/setup/status` | Setup credential | Redacted current MoonPress Chat state and readiness |
| POST | `/setup/validate` | Setup credential | Validate/normalize a configuration envelope without writing; returns `configuration_sha256` |
| POST | `/setup/apply` | Setup credential | Apply an explicitly approved envelope; snapshots first; visibility unchanged |
| POST | `/setup/verify` | Setup credential | Deterministic non-secret readiness checks |
| POST | `/setup/rollback` | Setup credential | Restore the snapshot made by the last apply (`{"rollback_id": "..."}`) |
| POST | `/setup/go-live` | Setup credential | Turn visibility on after blocking checks pass and explicit approval; revokes the connection |
| PUT | `/setup/provider` | Setup credential | Write/clear a provider secret; response never echoes it (helper `provider` subcommand only) |
| POST | `/setup/provider/test` | Setup credential | Test the stored active provider; returns non-secret status |
| DELETE | `/setup/connection` | Setup credential | Revoke the setup credential(s); returns `{"revoked": true}` |
| GET | `/setup/interview` | Setup credential | Interview questions, stored answers, orphaned ids, progress (4.8.0+) |
| PUT | `/setup/interview/answers` | Setup credential | Merge answers `{ set_id?, answers: { id: value\|null } }`; returns the fresh GET payload (4.8.0+) |
| DELETE | `/setup/interview` | Setup credential | Reset the interview ("start over"); never touches knowledge or the analysis draft (4.8.0+) |
| GET | `/setup/interview/preview` | Setup credential | Assembled prompt, its parts, the selection, and `envelope` — the knowledge envelope to validate/apply (4.8.0+) |

There is deliberately no `/setup/interview/apply`: the agent posts the
preview's `envelope` through the normal `validate` → `apply` pipeline, which
carries the approval, snapshot, rollback, and audit guarantees.

`POST /license/activate`, `POST /license/validate`, and `DELETE /license` are
**not registered**, and `pro_activation` is absent from the capability list.
Pro activation is a deferred product decision; never present it as available
or infer entitlement from anything this API returns.

## Capabilities and feature tiers

The compatibility payload advertises capabilities; gate on the list, never on
a plugin version string.

| Capability | Meaning | Shipped since |
|---|---|---|
| `status` | `GET /setup/status` | 4.3.0 |
| `validate` | `POST /setup/validate` | 4.3.0 |
| `apply` | `POST /setup/apply` | 4.3.0 |
| `verify` | `POST /setup/verify` | 4.3.0 |
| `rollback` | `POST /setup/rollback` | 4.3.0 |
| `go_live` | `POST /setup/go-live` | 4.3.0 |
| `provider_write` | `PUT /setup/provider` + `POST /setup/provider/test` | 4.3.0 |
| `self_revoke` | `DELETE /setup/connection` | 4.3.0 |
| `interview` | The four `/setup/interview*` routes | 4.8.0 |

## The API-path gate

Use the API path only when the public compatibility payload reports all of:

1. `available: true`;
2. `"1.0"` present in `schema_versions`;
3. every base capability present: `status`, `validate`, `apply`, `verify`,
   `rollback`, `go_live`, `provider_write`, `self_revoke`
   (`interview` gates only the interview stage);
4. `site_url` equal to the owner-supplied origin after normalization.

Anything less routes to the guided path with a recorded `reason`. The helper
enforces this gate itself during `connect`.

## Connection lifetime and revocation

The compatibility payload advertises the effective policy as
`connection: { max_lifetime, idle_timeout, revoked_on_go_live }`
(defaults 7200 s, 1800 s, `true`; a site may override the constants).

- **Idle timeout — 30 minutes** from the last authenticated request.
- **Hard maximum lifetime — 2 hours** from the Application Password's own
  creation stamp. This is the limit that always fires: plan the whole setup
  run inside it.
- **A successful `POST /setup/go-live` revokes every tracked setup
  credential** before responding and reports `connection_revoked` in the body.
  No disconnect step follows a successful go-live.
- **`DELETE /setup/connection` is also site-wide**: both terminal paths revoke
  every tracked credential, not only the presenting one. Two administrators
  running assisted setup against the same site simultaneously is not a
  supported flow.
- At most 8 credentials are tracked; a ninth is refused
  (`quipbot_setup_too_many_connections` in the site's audit log) and the run
  must stop.
- Multisite: refused outright — see below.

**The refusal reason does not reach the client.** When the plugin refuses a
credential at authentication (expired, capacity, non-administrator owner), the
request proceeds anonymously and the route answers a plain
`401 quipbot_setup_auth_required`. A client cannot tell "expired" from "never
authorized" from the response body. On any mid-flow 401: re-read the public
`GET /setup/compatibility` and ask the owner to re-authorize (`connect`
again). This is documented plugin behavior, not a bug to work around.

## Multisite refusal

On a multisite network the assisted setup API is refused by design:
`GET /setup/compatibility` answers `available: false` with a human-readable
`unavailable_reason` and an **empty** `capabilities` list, and the setup
credential is refused at authentication. WordPress Application Passwords are
network-global with no site-membership check, so a "setup-scoped" credential
cannot honestly be scoped to one site of a network. Use the guided path with
`reason: multisite`. This gate is permanent, not a temporary limitation.

## Configuration envelope

`POST /setup/validate` and `POST /setup/apply` accept exactly one closed
envelope shape:

```json
{
  "schema_version": "1.0",
  "configuration": {
    "provider":   { "id": "...", "model": "..." },
    "settings":   { "...": "see contracts/configuration-fields.md" },
    "knowledge":  { "fields": {}, "areas": [], "bank": {} },
    "templates":  { "greet": "..." },
    "appearance": { "...": "..." }
  },
  "approval": {
    "confirmed": true,
    "artifact_sha256": "64-lowercase-hex"
  }
}
```

- Every object is closed: unknown keys fail with
  `quipbot_setup_unknown_field` and a JSON-pointer-like `field`; unsupported
  versions fail with `quipbot_setup_unsupported_schema`. **Stop on either;
  never retry a mutated envelope.**
- Sections may be omitted for partial setup; an included section cannot be
  empty when empty would cause destructive replacement.
- Area keys are `area_1` through `area_9`; bank keys must refer to an included
  or already configured area.
- No envelope ever contains `live`, a provider secret, a license, an arbitrary
  option/meta name, or an arbitrary HTTP target.
- The field-by-field mapping lives in `contracts/configuration-fields.md`.

### Validate → approve → apply

1. `POST /setup/validate` is side-effect free and returns `valid`,
   `configuration_sha256`, `errors`, `warnings`, and a non-secret `summary`.
2. The approval fingerprint comes **from the server**: `apply` requires
   `approval.confirmed: true` and `approval.artifact_sha256` equal to the
   `configuration_sha256` validate returned. Never hash locally.
3. `apply` additionally requires the `X-Quip-Setup-Idempotency-Key` header
   (16–128 URL-safe characters; the helper auto-generates 32 hex chars for
   apply and go-live). A retry with the same key and fingerprint returns the
   original response; the same key with a different fingerprint fails
   `quipbot_setup_idempotency_conflict`. Records expire after 24 hours.
4. Before the first mutation the plugin snapshots exactly the options the
   included sections can change. The apply response carries `apply_id`,
   `rollback_id`, the fingerprint, and the applied sections — record all of
   them in the configuration plan.
5. A mid-apply failure restores the snapshot before returning. Success leaves
   `quipbot_live` exactly as it was.

### Rollback

`POST /setup/rollback` with `{"rollback_id": "<the id apply returned>"}`
restores only the exact MoonPress Chat options in the snapshot and consumes it on
success (`quipbot_setup_no_snapshot` when there is nothing to restore or the
id does not match). **The provider secret is never snapshotted and never
restored** — rollback restores the provider *selection* only. It also never
restores WordPress users, plugins, posts, arbitrary options, or external
provider state.

### Provider secret and test

The provider key travels only through the helper's `provider` subcommand
(TTY prompt, echo off) to `PUT /setup/provider`, which validates the
provider/model, stores the key write-only, and returns only
`{"provider": "...", "model": "...", "configured": true}`. The generic `call`
bridge refuses this route. `POST /setup/provider/test` tests the stored key
and returns a non-secret result; a failed test is not persisted (a re-test is
the remedial action in every state).

### Verify and go-live

`POST /setup/verify` returns `ready`, `live`, `last_apply`, and stable checks
with `pass`, `fail`, `blocked`, or `not_applicable`:
`compatibility`, `provider_selected`, `provider_configured`, `provider_test`,
`business_knowledge`, `consent`, `handoff`, `approved_apply` (all blocking),
and `visibility` (non-blocking; `blocked` while the widget is off, which is
the expected state during setup).

`POST /setup/go-live` requires `approval.confirmed: true`, the approved
`apply_id` and `configuration_sha256` from the last apply, a fresh idempotency
key, and every blocking verification check passing (`409
quipbot_setup_verification_failed` otherwise). It changes only `quipbot_live`,
records a redacted audit event, and **revokes every tracked setup credential**
(`connection_revoked` in the response). It never runs as part of apply.

## Error codes

Errors use the normal WordPress REST shape with stable codes:

- `quipbot_setup_auth_required`
- `quipbot_setup_capability_required`
- `quipbot_setup_scope_denied`
- `quipbot_setup_unsupported_schema`
- `quipbot_setup_unknown_field`
- `quipbot_setup_invalid_field`
- `quipbot_setup_request_too_large`
- `quipbot_setup_approval_required`
- `quipbot_setup_artifact_mismatch`
- `quipbot_setup_idempotency_required`
- `quipbot_setup_idempotency_conflict`
- `quipbot_setup_apply_failed`
- `quipbot_setup_no_snapshot`
- `quipbot_setup_verification_failed`
- `quipbot_setup_provider_missing`
- `quipbot_setup_provider_test_failed`
- `quipbot_setup_revoke_failed`

Interview routes (4.8.0+) add:

- `quipbot_setup_interview_no_source` — nothing to ask about yet; apply a
  preset or run the site analysis first (409).
- `quipbot_setup_interview_stale` — the question set changed; fetch
  `GET /setup/interview` again and answer against its `set_id` (409).

HTTP mapping: client-caused validation errors 400; unauthenticated 401;
insufficient capability 403; conflicts and failed gates 409; body too large
413; rate limit 429; unexpected storage/provider failures 500/502 without
sensitive detail.

## Fail-closed rules

- Unknown fields or versions: stop on `quipbot_setup_unknown_field` /
  `quipbot_setup_unsupported_schema`. Never retry mutated envelopes to probe
  the schema.
- A 401 mid-flow means an expired or revoked connection. Re-read the public
  `GET /setup/compatibility` and ask the owner to re-authorize; the refusal
  reason deliberately does not reach the client.
- Capacity refusals (`too_many_connections`, surfaced to the client as a
  plain 401) stop the run; do not mint credentials in a loop.
- Never route `PUT /setup/provider` through the generic bridge; never place a
  secret in an envelope, a file, argv, or chat.
- Never call `quipbot/v1/admin/*`, `/license/*`, XML-RPC, or any route outside
  `/setup`.
- When the compatibility gate does not pass in full, use the guided path; do
  not improvise partial automation.
