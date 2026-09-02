# Action: verify setup

## Plan verification

1. Ensure every required configuration section has a value, an explicit
   decision, or a visible blocker.
2. Confirm every business fact is sourced.
3. Confirm provider choice is recorded without a key.
4. Confirm consent, handoff, and prohibited-claim decisions are explicit.
5. Confirm the free-core language scope is represented accurately.
6. Confirm no write happened outside the approved path (API apply with
   recorded approval, or human-applied guided steps) and none was simulated.
7. Write `moonpresschat-setup/verification.md` from the QA checklist.

Verification has two pre-launch gates:

1. **Readiness gate:** every blocking row except L04 must be `pass` or a
   justified `not-applicable` before requesting go-live approval.
2. **Authorization gate:** request the decision separately. L04 must become
   `pass` before visibility is enabled.

`fail` or `blocked` keeps visibility off. Conditional items become blocking
when the corresponding feature or promise is enabled.

## API runtime verification (shipped default)

`POST /setup/verify` drives the automated checklist rows:

```bash
node helper/moonpresschat-setup-helper.mjs call https://example.com POST /setup/verify
```

It returns `ready`, `live`, `last_apply`, and stable checks — each `pass`,
`fail`, `blocked`, or `not_applicable`:

| Check id | Blocking | Meaning |
|---|---|---|
| `compatibility` | yes | Plugin/API compatibility |
| `provider_selected` | yes | An active supported provider is selected |
| `provider_configured` | yes | The active provider has a stored key |
| `provider_test` | yes | The stored key's most recent test is current (`blocked` until tested) |
| `business_knowledge` | yes | Non-empty business identity in the knowledge fields |
| `consent` | yes | A consent/disclosure decision is stored |
| `handoff` | yes | At least one handoff path (lead email or phone) |
| `approved_apply` | yes | Configuration fingerprint matches the last approved apply |
| `visibility` | no | Widget visibility state (`blocked` while off — expected during setup) |

Map each result onto `qa/verification-checklist.md` (the checklist names the
verify check that satisfies each row). Behavior tests (B01–B08) are not
covered by the API — run them through the human-observed preview as in the
guided path. Record every result without visitor personal data.

### Go-live

Only after **every blocking checklist row passes** and the owner's explicit,
separately recorded approval (L04):

1. Write the go-live body to a file, from the recorded apply:

   ```json
   {
     "approval": { "confirmed": true },
     "apply_id": "<from the apply response>",
     "configuration_sha256": "<from the apply response>"
   }
   ```

2. `call <origin> POST /setup/go-live --body <file>` — the helper
   auto-generates a fresh idempotency key and prints it.
3. The server re-runs verification and refuses with
   `409 quipbot_setup_verification_failed` while any blocking check fails, or
   `409 quipbot_setup_artifact_mismatch` when the ids do not match the last
   apply. It changes only the visibility flag.
4. **A successful go-live revokes the setup connection** and reports
   `connection_revoked` in the response — do not run `disconnect` after it,
   and expect any later call to answer 401 by design. If
   `connection_revoked` is `false`, the site is live but a credential
   survived: run `disconnect` to retry the revocation.
5. After go-live, verify one real public session anonymously (L05). If it
   fails, the immediate-disable path applies (L06): visibility off first, then
   the recorded rollback path.

## Guided runtime verification (fallback)

- The human confirms the selected provider/model and a successful **Test
  connection** result without exposing the key.
- The human confirms the reviewed preset or site-analysis draft was applied.
- The human opens the plugin preview link while public visibility remains off.
- Run the supported-question, refusal, consent, fallback, and handoff checks in
  `qa/verification-checklist.md`. Record evidence without visitor personal data.
- Test mobile and desktop rendering through human observation or a public,
  non-authenticated preview that the owner explicitly supplied.
- Ask for separate go-live approval only after the readiness gate passes; record
  L04 as passed before the human enables visibility.
- After approval and human activation, verify one real public session.

If the post-launch session fails, turn visibility off first (API path: the
human uses wp-admin, or a new authorized connection), confirm the widget is
absent anonymously, and follow `contracts/installation-and-rollback.md`. Do
not troubleshoot while the failed configuration remains public.

Mark anything that cannot be observed or confirmed `blocked`; never upgrade a
human instruction into a passed check.
