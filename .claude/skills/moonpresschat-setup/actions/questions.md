# Action: collect owner decisions

## Goal

Fill only the gaps that public research cannot answer.

## Question groups

Ask in short batches and explain why each answer changes the bot.

1. **Environment:** Is this staging or production, and who approves changes?
2. **Safety:** What backup/reset checkpoint and rollback path will be used?
3. **Outcome:** What should the assistant help a visitor accomplish?
4. **Audience:** Who is it for, and who is explicitly out of scope?
5. **Knowledge:** Which sources are authoritative? What must it never claim?
6. **Escalation:** When and how should a visitor reach a human?
7. **Lead capture:** Which details may be requested, and where should they go?
8. **Voice:** What tone, terminology, and prohibited wording apply?
9. **Consent:** What disclosure is approved? Is legal review required?
10. **Provider:** Which supported provider and model will the owner use?
11. **Language:** What is the single free-core site language? Multi-language
   operation is a separate premium decision and must not be promised.
12. **Launch:** Who may approve production writes and public go-live?

Also collect the field-level privacy and operational decisions in
`templates/owner-answers.md`: anonymous retention, browser memory, digest and
recipient, takeover timeout, error/offline wording, reporting promises, and
widget appearance. Do not infer them from plugin defaults.

## Recording rules

- Use `templates/owner-answers.md`.
- Quote consequential wording exactly when the owner provides it.
- Mark every unanswered decision `unresolved`.
- Never infer a legal, privacy, retention, or commercial decision.
- Never request the provider key; the human enters it through the helper's
  `provider` subcommand (API path) or in WordPress admin (guided path).
