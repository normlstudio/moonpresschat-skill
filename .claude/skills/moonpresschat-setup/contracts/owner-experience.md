# Owner experience

Author: Artur Tsitou. Updated: 2026-10-09.

## One proposal, one apply decision

- Speak in the owner's language. Start with what is configured or what decision
  is needed, not a narration of tool calls.
- Reuse explicit site authority, target environment, workspace, Node choice and
  business decisions from the current session. Read public facts and available
  non-secret API state before asking. Do not repeat the admin wizard in chat.
- Use an already installed compatible Node by its full path without changing
  the default. Choose the task's existing workspace for artifacts when explicit.
- Ask at most three genuinely unresolved questions in a batch. Keep field-by-
  field coverage and source references in artifacts. Clearly label proposed
  privacy/retention/consent decisions; never silently infer their approval.
- The requested setup authorizes research and preparation. Human browser consent
  grants access; it is not approval of arbitrary configuration changes. Submit
  interview answers only within the approved setup scope.
- Prepare and validate one internally consistent configuration. Correct known
  preset contradictions using sourced facts and approved decisions before review.
  Preserve user content unrelated to the requested setup. If resolving a
  contradiction needs a business decision, ask the specific question.
- Show the business changes, material warnings and visibility outcome in a short
  summary (usually up to six bullets). Ask once to apply this exact proposal.
  Do not ask the owner to compare hashes or choose a knowingly faulty variant.
- Explicit user requests for an earlier plan approval still apply. Otherwise do
  not add a separate approval for the plan, artifact directory, validation,
  routine provider test, verification or disconnect. Real costs or new scope
  outside the existing authorization require their own decision.
- Keep the server fingerprint, idempotency key and rollback IDs in artifacts;
  preserve all safeguards even though they are absent from the chat summary.
- After apply approval, execute the authorized sequence through verification and
  disconnect. Do not ask the user to say “continue” between successful stages.
  Public go-live remains a separate explicit decision after readiness passes.

## Resume without repeating the interview

Read existing artifacts and reuse recorded decisions. Check the connection via
the helper; reconnect only when absent or expired. The owner still approves in
their browser. Re-read site status and validate the saved proposal again.
If the returned fingerprint and relevant current state match the approved plan,
continue under that approval. If configuration or relevant site state changed,
show only the material difference and obtain approval for the revised proposal.
Do not extend credentials, suppress consent, or poll to keep access alive.

## Completion message

State what was configured, which checks passed, whether the widget is visible,
and whether access was revoked. Mention only actionable unresolved problems.
Link the detailed report instead of pasting its checklist.

For a disposable offline fixture, report “Setup applied and API checks passed;
widget remains off; access disconnected.” Add that real-provider answers, mail
delivery and browser behavior remain unverified if mocked/unobserved. These
boundaries must stay in the report and must not be called production readiness.
Do not ask the owner to fix deliberately disabled test services.

## Acceptance examples

| Input / situation | Required behavior |
|---|---|
| Owner already supplied a local test site and workspace | Use them; no repeated four-question preflight |
| Default Node 20, installed Node 22.22.2 | Use the existing executable; no install/default-switch permission loop |
| Multiple languages requested on free core | Use supported enabled languages and default; no invented Pro restriction |
| Owner says there are no prices; preset promises plans and quotes | Correct editable FAQ and subtitle before validate; present one proposal |
| Preset claims staff read all conversations without evidence | Remove the unsupported claim before review |
| Validate returns zero warnings but FAQ contradicts owner | Fix semantic content; schema success is not factual verification |
| Yesterday's approval, connection expired | One browser reauthorization; unchanged revalidated plan needs no new apply decision |
| Site changed during interruption | Review the difference; do not overwrite under stale approval |
| API verification passes against an offline mock | Report API success and mock limits; no real-key or model-quality claim |
| Owner says keep widget off | Verify and disconnect; do not solicit go-live |
| User explicitly requests a plan before any writes | Honor that extra gate, including interview-answer persistence |
