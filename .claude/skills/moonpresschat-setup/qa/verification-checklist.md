# MoonPress Chat setup verification checklist

Use `pass`, `fail`, `blocked`, or `not-applicable` for each item. For each row,
record `status`, `evidence`, `tested_by`, and `tested_at`. A blocking row may be
`not-applicable` only when the reason is explicit and the corresponding feature
is not enabled or promised.

## Release rule

- `blocking`: must pass before go-live.
- `conditional`: becomes blocking when the feature is enabled or promised.
- `post-launch`: run immediately after go-live; failure triggers visibility off
  and rollback before troubleshooting.

Run the pre-launch gate in two phases: all readiness-blocking rows except L04,
then request approval and pass L04. Visibility may be enabled only after both
phases pass.

## API-path evidence map

On the API path (`connection: api`), `POST /setup/verify` supplies the
automated evidence; the guided-path evidence column in the tables below stays
authoritative for human-observed rows. After a successful go-live the
connection is revoked (`connection_revoked`), so post-launch rows use public
anonymous observation, never another API call.

| ID | How the API path satisfies it |
|---|---|
| A01 | Unchanged — human confirmation |
| A02 | Helper `connect` gate: compatibility `site_url` equals the supplied origin |
| A03 | Compatibility payload (`available`, `plugin_slug`, `plugin_version`, capabilities) + verify check `compatibility` |
| A04 | Unchanged — human confirmation; also record the apply's `rollback_id` |
| A05 | Verify check `visibility` reports `blocked` (off) during setup |
| A06 | Guided runs only — the API-path counterpart is A07 |
| A07 | Credential stored by the helper in the macOS Keychain; transcript carries only redacted helper output; capability gate recorded at connect |
| D01 | Verify check `provider_selected` + `GET /setup/status` provider/model versus the approved plan |
| D02 | Verify check `provider_test` passing (written by `POST /setup/provider/test`); the key is never returned |
| D03 | Unchanged — plan artifact review |
| D04 | Secret-pattern scan of artifacts plus helper output (redacted by construction) |
| D05 | Validate `summary` + `GET /setup/status` compared to the field-level plan rows |
| D06 | Unchanged — human-confirmed when enabled |
| B01–B08 | Not covered by the API — human-observed preview, exactly as on the guided path |
| L01 | Unchanged — report/digest observation |
| L02 | Unchanged — human observation of the preview |
| L03 | Verify check `visibility` stayed `blocked` until go-live; apply never changes visibility |
| L04 | Explicit approval recorded first, then the `POST /setup/go-live` body carries `approval.confirmed: true` + `apply_id` + `configuration_sha256`; verify check `approved_apply` passing |
| L05 | Unchanged — one anonymous public session |
| L06 | Visibility off first (human), then `POST /setup/rollback` restores the apply snapshot (never a provider secret) |

## Authority, installation, and connection

| ID | Gate | Check | Required evidence |
|---|---|---|---|
| A01 | blocking | Site ownership/management authority confirmed | Named owner/approver confirmation |
| A02 | blocking | Canonical HTTPS origin and target environment confirmed | Origin + staging/production |
| A03 | blocking | MoonPress Chat active and compatible | Plugin/WP/PHP versions + Setup opens |
| A04 | blocking | Backup/reset and rollback paths confirmed | Human confirmation + operator/timestamp |
| A05 | blocking | Public visibility is off during setup | Human confirmation or anonymous observation |
| A06 | blocking | Guided wp-admin remained human-operated; no authenticated screenshot or secret shared | Artifact/transcript review |
| A07 | conditional | Automated credential stayed outside transcript; least capability and public API version supported | Helper connect summary + compatibility gate record (blocking on the API path) |

## Provider and data

| ID | Gate | Check | Required evidence |
|---|---|---|---|
| D01 | blocking | Provider and model match approved plan | Human-confirmed provider/model |
| D02 | blocking | Provider test passes without revealing key | Passed status only |
| D03 | blocking | Knowledge facts map to cited or owner-supplied sources | Field-to-source sample + unresolved list empty |
| D04 | blocking | No credential appears in artifacts or logs | Secret-pattern scan + human confirmation |
| D05 | blocking | Retention, browser memory, lead fields, and recipients match privacy decision | Field-level plan comparison |
| D06 | conditional | Daily transcript notification matches approved recipient and policy | Human-confirmed test/setting if enabled |

## Behavior test matrix

Use prepared fictional inputs only; never use real visitor personal data.

| ID | Gate | Test | Minimum evidence |
|---|---|---|---|
| B01 | blocking | Two common supported questions | Expected source + answer outcome for each |
| B02 | blocking | One unknown-business question | Honest unknown + approved next step |
| B03 | blocking | One prohibited/high-risk claim | Refusal or human escalation, no partial fulfillment |
| B04 | blocking | One unrelated request | In-scope decline without answering it |
| B05 | blocking | Consent before first external message | Exact approved notice observed; `not-applicable` only with an explicit recorded owner/legal decision to disable the consent gate |
| B06 | conditional | AI disclosure/disclaimer | Approved wording observed when enabled/promised |
| B07 | conditional | Human handoff/lead route | Fictional lead reaches approved destination if enabled |
| B08 | conditional | Service error and assistant-offline states | Service error: human uses browser offline mode in preview, without changing WordPress; assistant-offline: test before the first key is saved or on a disposable staging copy. For an existing write-only key with no disposable copy, inspect the configured copy and record `not-applicable-existing-key-no-safe-fault-injection`; never clear or overwrite the key merely to force this state. |

## Launch and recovery

| ID | Gate | Check | Required evidence |
|---|---|---|---|
| L01 | conditional | Test conversations excluded from reporting where promised | Report/digest observation if promised |
| L02 | blocking | Widget usable on mobile and desktop | No clipping; launcher target at least 44px |
| L03 | blocking | Public widget stayed off during configuration | Human confirmation or anonymous check |
| L04 | blocking | Explicit go-live approval recorded separately | Exact approver + decision + timestamp |
| L05 | post-launch | One anonymous public session passes | Fictional input/outcome, no personal data stored |
| L06 | post-launch | Failed launch can be disabled immediately | If L05 fails: visibility off + widget absent |
