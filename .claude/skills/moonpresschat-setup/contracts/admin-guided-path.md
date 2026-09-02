# Guided MoonPress Chat admin path

This is the **fallback path**. The default is the API path through the shipped
setup API and credential helper (`actions/connect.md`); use this guided
sequence when the compatibility gate does not pass or the owner declines the
helper — multisite, a plugin older than MoonPress Chat 1.0.0 (its
compatibility endpoint answers 404), or a platform without a supported
credential backend. The human remains in control of the authenticated
WordPress browser. The agent prepares the plan, explains each step, and
records non-secret confirmations.

This sequence navigates by menu label, so it reads the same on every
supported release. For recognizing a URL the human reads back: MoonPress
Chat 1.0.0 renamed its admin page slugs to `admin.php?page=moonpresschat-*`
(`moonpresschat-start`, `moonpresschat-analyze`, `moonpresschat-kb`,
`moonpresschat-settings`) and its DOM ids/classes to `moonpresschat-*`. Never
ask the human to read out or paste anything from the page beyond such
non-secret status.

## Before entering wp-admin

1. Complete `preflight.md`: canonical origin, authority, installation/version,
   environment, backup/reset path, rollback, and visibility off.
2. Record the current non-secret baseline from
   `contracts/installation-and-rollback.md`.
3. Complete `research.md`, `owner-answers.md`, and the field-level rows in
   `configuration-plan.md`.
4. Keep MoonPress Chat in preview mode until verification passes.
5. Ask for explicit approval of the plan before the human changes WordPress.

## Human-operated sequence

### 1. Connect the AI provider

Open **MoonPress Chat → Settings → AI providers**.

- Choose Anthropic, OpenAI, Gemini, or OpenRouter.
- Choose a listed model or enter a provider-supported custom model ID.
- The human pastes the provider key into the password field.
- Click **Test connection**, then **Save settings**.
- Record only provider, model, and whether the test passed. Never ask for the
  key, its prefix/suffix, an authenticated screenshot, or a copied response.

The site owner pays the provider directly. MoonPress Chat core is free forever. A
future MoonPress Chat Pro license does not include provider inference.

### 2. Give the assistant starting knowledge

Open **MoonPress Chat → Setup**.

- For a no-cost starting point, apply the closest industry preset and review
  every generated topic afterward.
- For site-specific generation, use **Analyze my site** only after the provider
  test passes. Review the collected pages and generated draft before applying.
- Never treat generated facts, consent text, or regulated guidance as approved
  merely because the plugin created them.

### 3. Review knowledge and behavior

Open **MoonPress Chat → Knowledge base**.

- Compare business facts and Q&A entries with `research.md` and owner answers.
- Keep hard rules and prohibited claims explicit.
- Remove unsupported facts and add missing escalation boundaries.

Open **MoonPress Chat → Templates** and review visitor-facing prompts and fallbacks.

### 4. Review operations and privacy

Open **MoonPress Chat → Settings** and review these sections:

- **Legal texts** — consent and short disclosure.
- **Contacts** — lead destination and contact routes.
- **Notifications** — digest behavior and recipient.
- **Anonymous conversations** — retention and browser-memory choice.
- **Human takeover** — return-to-assistant behavior.
- **Widget appearance** and **Languages** — approved identity and language scope.

Use `contracts/configuration-fields.md` to record every field separately,
including its environment, data classification, verification, and rollback.

Do not enable paid-only behavior without a valid entitlement. Do not promise a
public setup API, managed inference, or WordPress.org availability before each
is actually released.

### 5. Preview, verify, and go live separately

Keep **Settings → Visibility → Make the bot live for visitors** off. Use the
plugin's preview link to run the verification checklist.

After every readiness-blocking check except L04 passes, ask separately:

> The reviewed setup passes the guided verification. Do you approve making
> MoonPress Chat live for visitors on this site now?

Record the explicit yes as L04 passed. Only then should the human enable
visibility and save. Verify one public conversation without putting visitor
personal data in the setup artifacts.

## Status values

Record these in `configuration-plan.md`:

```yaml
connection: guided-manual
reason: multisite | plugin-predates-api | owner-declined-helper | credential-backend-unsupported
provider_test: pending | passed | failed
configuration: planned | human-applied | verified
go_live: off | approved | live
```

Never use `passed` or `verified` based only on an instruction being shown. The
human must confirm the result or the public behavior must be independently
observable without authentication.
