# Action: prepare or apply configuration

## Prepare the reviewed plan

Create `moonpresschat-setup/configuration-plan.md` from the research and owner answers.
For every field, record:

- proposed value or action;
- source: public URL, owner answer, or MoonPress Chat default;
- approval state;
- target environment;
- whether it contains personal or regulated information;
- verification method.
- current non-secret value/status and rollback action.

Cover at least:

- provider and model choice, excluding the key;
- knowledge/business facts and FAQ topics;
- consent and AI disclosure;
- human handoff and contact routes;
- lead-capture behavior;
- operating boundaries and prohibited claims;
- error/offline wording;
- widget identity and appearance;
- one site language for the free core;
- launch-gate status.

Use `contracts/configuration-fields.md`; do not collapse the plan to one broad
row per screen.

## API apply flow (shipped default)

Requires `connection: api` from `actions/connect.md`. Fingerprints come from
the server, never from local hashing.

### Interview stage (capability-gated)

Run this first when the compatibility payload advertises the `interview`
capability (plugin 4.8.0+) and a preset or site analysis exists. Interview
questions and the owner's answers are business context, not secrets — they may
flow through chat by design.

1. `call <origin> GET /setup/interview` — returns `set_id`, the ranked
   `questions`, stored `answers`, `orphaned` answer ids, and `progress`. A
   `409 quipbot_setup_interview_no_source` means nothing to ask about yet:
   apply a preset or run the site analysis first.
2. Ask the owner the open questions in chat, in short batches, following the
   recording rules of `actions/questions.md`. Do not invent answers; an
   explicit skip is `null`.
3. Write the answers to a file and
   `call <origin> PUT /setup/interview/answers --body <file>` with
   `{ "set_id": "<from step 1>", "answers": { "<question id>": <value or null> } }`.
   On `409 quipbot_setup_interview_stale`, re-fetch `GET /setup/interview` and
   re-answer against the new `set_id`.
4. `call <origin> GET /setup/interview/preview` — returns the assembled
   prompt, its `parts`, the `selection`, `warnings`, and `envelope`: a ready
   `{schema_version, configuration: {knowledge: …}}`. Show the owner what the
   preview will make the assistant say.
5. Fold `envelope.configuration.knowledge` into the configuration envelope
   below (or validate the preview envelope as-is when knowledge is the only
   section). There is deliberately no interview apply route — the write goes
   through validate → approve → apply like everything else.

`DELETE /setup/interview` resets the interview ("start over") without touching
knowledge, the analysis draft, or the preset marker.

### Envelope: validate → approve → apply

1. Build the configuration envelope from the **approved plan** using the
   envelope mapping in `contracts/configuration-fields.md`. Save it as
   `moonpresschat-setup/configuration-envelope.json` (non-secret; `schema_version`
   `"1.0"`; omit sections the plan does not change; never include `live`, a
   key, or any field the mapping does not name).
2. Validate — side-effect free:

   ```bash
   node helper/moonpresschat-setup-helper.mjs call https://example.com POST /setup/validate --body moonpresschat-setup/configuration-envelope.json
   ```

   Stop on `valid: false`, `quipbot_setup_unknown_field`, or
   `quipbot_setup_unsupported_schema` — fix the plan, never mutate-and-retry.
   Record the returned `configuration_sha256`, `warnings`, and `summary`.
3. Show the owner the validate summary and warnings next to the plan and ask
   for explicit approval of exactly this configuration.
4. On approval, add to the same envelope file:

   ```json
   "approval": { "confirmed": true, "artifact_sha256": "<the configuration_sha256 validate returned>" }
   ```

   and apply:

   ```bash
   node helper/moonpresschat-setup-helper.mjs call https://example.com POST /setup/apply --body moonpresschat-setup/configuration-envelope.json
   ```

   The helper auto-generates the idempotency key and prints it in the result
   envelope. Record `apply_id`, `rollback_id`, `configuration_sha256`, the
   applied `sections`, and the idempotency key in the plan. A retry with the
   same key and body returns the original response; apply never changes
   visibility.
5. Update the plan to `configuration: applied` and hand off to
   `actions/verify.md`.

### Provider key and test

The envelope's `provider` section selects provider and model; the **key** is
separate. The human runs, in their own terminal:

```bash
node helper/moonpresschat-setup-helper.mjs provider https://example.com <provider-id> <model>
```

The helper prompts for the key on its own TTY with echo off and prints only
`{provider, model, configured}`. Then test the stored key:

```bash
node helper/moonpresschat-setup-helper.mjs call https://example.com POST /setup/provider/test
```

Record only the non-secret result. A failed test is not persisted; re-running
the test is the remedial action.

### Rollback

To undo the last apply, write `{"rollback_id": "<the id apply returned>"}` to
a file and `call POST /setup/rollback --body <file>`. It restores exactly the
snapshotted options and consumes the snapshot; **it never restores the
provider secret** (only the provider selection). After a rollback that changed
the provider selection, re-run `POST /setup/provider/test`.

## Guided apply mode (fallback)

1. Show the complete non-secret plan and ask for explicit approval.
2. After approval, read `contracts/admin-guided-path.md` and give one short
   wp-admin step at a time.
3. The human performs every authenticated click, paste, save, and provider test.
4. Ask only for non-secret results. Never ask for a key, authenticated
   screenshot, copied headers, cookie, or response body.
5. Update the plan to `configuration: human-applied` only after the human
   confirms the relevant save succeeded.
6. Keep visibility off and hand off to `actions/verify.md`.

If the human cannot access a named screen or label, record the exact mismatch
and stop that section. Do not improvise with internal routes, SSH, or SQL.
