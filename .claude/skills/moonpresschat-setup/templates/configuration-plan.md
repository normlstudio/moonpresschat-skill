# MoonPress Chat configuration plan

## Status

- Environment:
- Installation: `active | inactive | absent | blocked-official-package | unresolved`
- Plugin version:
- Compatibility: `passed | blocked-plugin-upgrade | blocked-runtime | blocked-guide-drift`
- Backup/reset checkpoint: `confirmed | unresolved | blocked`
- Rollback owner/action:
- Connection: `api | guided-manual`
- Connection reason (guided only): `multisite | plugin-predates-api | owner-declined-helper | credential-backend-unsupported`
- API apply record (API path): apply_id / rollback_id / configuration_sha256 / idempotency key
- Provider test: `pending`
- Configuration: `planned`
- Proposed by:
- Approved by:
- Go-live: `off`

## Current non-secret baseline

- Visibility:
- Active provider/model:
- Provider key saved: `yes | no | unknown` (never record the key)
- Enabled site language:
- Populated configuration areas:

## Field-level proposed configuration

Add one row for every applicable field in
`contracts/configuration-fields.md`. Do not combine multiple controls into one
row.

| Screen / field | Current non-secret state | Proposed value/action | Source | Approval | Environment | Personal/regulated data | Verification | Rollback |
|---|---|---|---|---|---|---|---|---|
| AI providers / Active provider | | | Owner answer | Pending | | No | Human confirmation | Restore prior selection |
| AI providers / Model | | | Owner answer | Pending | | No | Provider test | Restore prior model |
| AI providers / Provider key | Saved/not saved only | Human enters directly | Owner action | Pending | | Secret — never record | Test passed status | Human restores/clears key |
| Knowledge base / Business facts | | | Research + owner | Pending | | Review | Supported-question tests | Restore baseline/backup |
| Knowledge base / FAQ bank | | | Research + owner | Pending | | Review | Supported-question tests | Restore baseline/backup |
| Knowledge base / Hard rules | | | Owner answer + safety floor | Pending | | No | Refusal tests | Restore baseline/backup |
| Settings / Consent notice | | | Owner/legal answer | Pending | | Legal decision | Consent gate test | Restore baseline |
| Settings / Short disclaimer | | | Owner/legal answer | Pending | | Legal decision | Answer disclosure test | Restore baseline |
| Settings / Visibility | Off | Keep off until approval | Launch gate | Pending | | No | Anonymous public check | Turn off immediately |

## Provider-key action

The human enters the key directly in the write-only MoonPress Chat settings UI. The
agent may later confirm only provider, model, `has_key`, and test status.

## Guided apply sequence

1. Approve this non-secret plan.
2. Human connects and tests the provider in MoonPress Chat Settings.
3. Human applies a reviewed preset or site-analysis draft.
4. Human reviews Knowledge base, Templates, legal text, contacts, notifications,
   retention, appearance, and language.
5. Human keeps visibility off and runs the preview verification.
6. Receive separate go-live approval.
7. Human enables visibility and verifies one public session.

## Automated write sequence (API path)

1. Connect through the shipped helper (`connect`); note the two-hour hard
   lifetime and 30-minute idle timeout.
2. Read current setup state (`GET /setup/status`).
3. Build the envelope from this approved plan and `POST /setup/validate`.
4. Show the validate summary and warnings; receive explicit production-write
   approval.
5. `POST /setup/apply` with `approval.confirmed: true` and the server's
   `configuration_sha256`; record apply_id / rollback_id / idempotency key.
   Visibility stays unchanged.
6. Human enters the provider key through the helper `provider` subcommand;
   `POST /setup/provider/test`.
7. `POST /setup/verify` plus the checklist's human-observed behavior tests.
8. Receive separate go-live approval.
9. `POST /setup/go-live` (revokes the connection) and verify one public
   session.

## Blockers

- Installation/compatibility:
- Backup/reset or rollback:
- API path unavailable (guided reason, if any):
-
