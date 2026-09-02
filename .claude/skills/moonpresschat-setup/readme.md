# moonpresschat-setup

> Safely install, research, plan, connect, configure, and verify MoonPress Chat on
> WordPress without exposing site passwords or AI-provider keys to the agent.

## The problem

A useful WordPress chatbot needs more than an API key. It needs grounded
business knowledge, approved wording, consent, escalation rules, and a testable
launch decision.

Ordinary chat-based setup also creates a security trap: people paste WordPress
passwords, Application Passwords, provider keys, or reset links into the AI
conversation. `moonpresschat-setup` separates human authorization from agent work and
stores only non-secret setup artifacts.

## Install

Install the public skill for your local agent:

Choose the runtime you use and run one command:

```bash
# Claude Code
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a claude-code

# Codex
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a codex

# Gemini CLI
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a gemini-cli
```

The current open `skills` installer requires Node.js 22.20 or newer. If it
reports an engine-version error, update Node through your normal developer
tooling before retrying.

The installer supports agents in the open skills ecosystem. Then start a new
agent turn with:

```text
Use moonpresschat-setup to set up MoonPress Chat on https://example.com
```

Use only the public site URL. Never place a WordPress password, provider key,
Application Password, or secret URL in the command or conversation.

## How to use it

| When you want to… | Say something like… |
|---|---|
| Start a complete setup | *"Set up MoonPress Chat on my WordPress site."* |
| Research before configuring | *"Research my site before configuring MoonPress Chat."* |
| Plan the bot's knowledge | *"Help me plan the MoonPress Chat knowledge base."* |
| Prepare the safe connection | *"Connect this WordPress site to the MoonPress Chat setup flow."* |
| Review launch readiness | *"Review whether MoonPress Chat is ready to go live."* |
| Continue existing work | *"Resume my MoonPress Chat setup."* |

## A typical run

1. It confirms authority, environment, official installation, compatibility,
   backup/reset, rollback, and public visibility in `moonpresschat-setup/preflight.md`.
2. The skill reads public pages and writes cited findings to
   `moonpresschat-setup/research.md`.
3. It asks only for owner decisions the site cannot answer and records them in
   `moonpresschat-setup/owner-answers.md`.
4. It creates a field-by-field plan in `moonpresschat-setup/configuration-plan.md`.
5. After approval, it validates and applies the configuration through the
   published MoonPress Chat setup API — or guides the human through wp-admin on the
   fallback path — while staying outside the authenticated browser.
6. It records passed, failed, and blocked checks in `verification.md`, then asks
   separately before the public widget goes live.

> **Public alpha:** version 0.5.0 ships both paths. The API path is the
> default — MoonPress Chat's stable setup API (`moonpresschat/v1/setup`,
> MoonPress Chat 1.0.0 or newer) plus the bundled macOS credential helper —
> and the human-guided wp-admin path remains the documented fallback for
> multisite, plugins older than 1.0.0, or platforms without a supported
> credential backend.

---

## Details

### What the skill does

The workflow has six visible stages:

1. **Preflight** — checks authority, official installation, versions,
   environment, backup/reset, rollback, and visibility.
2. **Research** — reads public site pages and cites every business fact.
3. **Owner questions** — collects operating decisions, boundaries, and wording.
4. **Connect** — runs WordPress core's Application Password consent through
   the system browser; the bundled helper stores the credential in the macOS
   Keychain, outside the transcript.
5. **Configure** — maps approved inputs to provider, knowledge, consent,
   handoff, lead, appearance, language, and launch settings.
6. **Verify** — checks authority, data, behavior, privacy, and launch gates.

Version 0.5.0 runs all six stages through the shipped setup API by default
and through the human-operated wp-admin path as the fallback. It never
pretends that an unavailable connection or capability exists: the path is
chosen by the public compatibility gate, and every gap is recorded with its
reason.

### Inputs

Required:

- canonical public WordPress site URL;
- confirmation that the user may manage the site;
- a writable local folder for non-secret artifacts;
- staging or production target.

Collected during setup:

- business purpose and visitor outcomes;
- approved public and private knowledge sources;
- must-answer and must-not-answer topics;
- handoff and lead-routing rules;
- tone, disclosure, consent, and launch authority;
- provider and model choice, excluding the provider key;
- one free-core site language.

Optional inputs include a staging URL, existing support or policy documents,
and prior setup artifacts.

### Outputs

The skill creates or reuses this folder:

```text
moonpresschat-setup/
├── preflight.md
├── research.md
├── owner-answers.md
├── configuration-plan.md
└── verification.md
```

- `preflight.md` records installation, compatibility, environment, recovery,
  and visibility gates.
- `research.md` separates sourced facts, inferences, and unknowns.
- `owner-answers.md` records approvals and unresolved decisions.
- `configuration-plan.md` maps every proposed field to its source and test.
- `verification.md` exposes each pass, failure, and blocker.

None of these files may contain a password, Application Password, provider key,
moonpresschat.com token, license key, payment key, reset link, cookie, or secret-bearing URL.

### Research behavior

The research stage checks the canonical HTTPS origin, `robots.txt`, and the XML
sitemap when available. It reads the most relevant public business, product,
service, contact, FAQ, policy, and support pages.

It does not log in, submit forms, scrape visitor information, or bypass a site
that blocks automated reading. It never turns marketing claims into guarantees
or legal advice.

When public reading is unavailable, the skill may use a local file, pasted
excerpt, or URL deliberately supplied by the owner. It labels that material
`owner-supplied`, records its title/date and public/private status, and never
misrepresents it as independently public-verified.

### Installation and recovery

The cold-start preflight works whether MoonPress Chat is already active or absent. The
human reports the plugin, WordPress, and PHP versions from wp-admin. This guide
verifies the guided screen guidance against MoonPress Chat 3.11.0 and the API
contract against MoonPress Chat 1.0.0 — the API path requires 1.0.0 or newer
(the plugin restarted its numbering with the rename; 4.8.0 and older still
speak the old REST namespace, answer 404 on the compatibility endpoint, and
use the guided path) — with WordPress 6.2 and PHP 7.4 as runtime floors.

If the plugin is absent, the human installs only from a verified official
WordPress directory result, official MoonPress Chat product download, or the owner's
existing MoonPress Chat/Norml delivery channel. The skill never invents a package URL
or substitutes an unofficial mirror. No verified package means the honest
result is `installation: blocked-official-package`.

Staging is preferred when available. Production changes require a
human-confirmed restorable backup. The recorded immediate-disable path is to
turn visibility off; if wp-admin's MoonPress Chat UI is unavailable, the human may
deactivate the plugin. Failed public behavior is disabled before troubleshooting.

### Owner-question behavior

Questions arrive in short batches and cover:

- visitor outcome and audience;
- authoritative knowledge and exclusions;
- escalation, contact, and lead fields;
- voice, terminology, and prohibited wording;
- disclosure, consent, and legal-review status;
- provider and model choice;
- free-core site language;
- production-write and go-live approvers.

The skill marks an unanswered decision `unresolved`; it does not manufacture an
answer.

### Connection model

The default connection is `api`. The bundled helper
(`helper/moonpresschat-setup-helper.mjs`, single-file Node.js >= 22.20, zero
dependencies) opens WordPress core's Application Password consent screen in
the system browser; the owner signs in and approves, and the helper stores the
generated credential directly in the macOS Keychain before printing a redacted
summary. The connection is temporary by server design: a 30-minute idle
timeout, a two-hour hard lifetime, and automatic revocation on go-live.

The agent talks to WordPress only through the helper's closed subcommands —
paths must stay inside `/setup`, absolute URLs are refused, and the
provider-key route is unreachable from the generic bridge. The provider key is
typed by the human on the helper's own terminal prompt with echo off.

The fallback connection is `guided-manual`, recorded with an explicit reason
(multisite, a plugin older than MoonPress Chat 1.0.0, an owner who declines the
helper, or a platform without a supported credential backend — the helper is
macOS-only in this release; Windows and Linux exit
`credential-backend-unsupported`). The human uses their existing authenticated
wp-admin session while the agent stays outside the browser, enters the
provider key in MoonPress Chat's write-only field, and reports only non-secret state.

```yaml
connection: api | guided-manual
reason: multisite | plugin-predates-api | owner-declined-helper | credential-backend-unsupported
```

The agent never controls the browser, reads the authenticated page, collects the
normal WordPress password, or receives the generated Application Password. It
does not fall back to browser automation, SSH, XML-RPC, direct database
access, or a credential pasted into chat.

### Configuration model

On the API path, the skill builds one non-secret configuration envelope from
the approved plan and drives it through the published contract
(`moonpresschat/v1/setup`, API version 1.0, verified against MoonPress Chat 1.0.0):

1. `POST /setup/validate` — side-effect free; returns the server's
   configuration fingerprint, warnings, and a summary;
2. explicit owner approval of exactly that configuration;
3. `POST /setup/apply` with `approval.confirmed: true`, the server-returned
   `configuration_sha256`, and an idempotency key — the plugin snapshots the
   affected options first and visibility never changes;
4. optional `POST /setup/rollback` restores that snapshot (never a provider
   secret);
5. when the plugin advertises the `interview` capability (1.0.0+), the skill
   fetches the onboarding interview questions, asks the owner in chat, submits
   the answers, previews the assembled prompt, and folds the preview's
   envelope into the same validate → approve → apply pipeline.

Unknown fields and unsupported schema versions fail closed: the skill stops
rather than retrying mutated envelopes. The plugin's internal admin routes are
still not a public contract, and the setup credential cannot reach them.

On the guided path, the skill directs the human through **Settings → AI
providers**, **Setup**, **Knowledge base**, **Templates**, and the operational
Settings sections. The human keeps visibility off until verification passes.
The MoonPress Chat 3.11.0 field map requires a separate plan row for every control,
including current state, source, approval, environment, data classification,
verification, and rollback.

### Provider keys and moonpresschat.com accounts

The human enters the provider key through the helper's `provider` subcommand
(a terminal prompt with echo off, API path) or in MoonPress Chat's write-only
WordPress settings (guided path). Automation may inspect provider, model,
`has_key`, and test status, but never the key.

The free MoonPress Chat core does not require a moonpresschat.com account or paid license. A future
MoonPress Chat device-authorization flow belongs only to a premium entitlement or managed
service that genuinely needs an account.

### Language and paid-feature boundary

The free setup records one WordPress site language. It does not promise true
multi-language operation; that capability is assigned to the future paid layer.

The skill never enables a paid capability the account does not own and never
uses a license to disable functionality already included in the free core.

### Verification

Plan verification checks that every configuration area has a value, an explicit
decision, or a visible blocker. Guided verification then confirms the human's
non-secret provider-test result, reviewed knowledge, consent, handoff, preview
behavior, and separate go-live approval. It also confirms the provider key is
absent and direct agent writes were not simulated. The checklist labels
blocking, conditional, and post-launch gates and defines concrete supported,
unknown, refusal, unrelated-request, consent, disclosure, handoff, fallback,
and responsive tests.

On the API path, `POST /setup/verify` runs the deterministic readiness checks
(compatibility, provider selection and key, provider test, business knowledge,
consent, handoff, approved apply, visibility state) and go-live is a separate
`POST /setup/go-live` that requires every blocking check to pass plus explicit
approval — and then revokes the setup connection itself. Behavior tests
(grounded answers, refusals, consent, handoff, offline states, mobile/desktop
appearance) remain human-observed on both paths.

### Where things live

- `SKILL.md` — executable workflow and guardrails.
- `actions/` — one file for each stage.
- `contracts/security-model.md` — trust and credential boundaries.
- `contracts/admin-guided-path.md` — current human-operated wp-admin sequence.
- `contracts/installation-and-rollback.md` — official package, version,
  environment, backup, and recovery contract.
- `contracts/configuration-fields.md` — field-level MoonPress Chat 3.11.0 map.
- `contracts/current-api-contract.md` — the shipped setup API surface.
- `helper/moonpresschat-setup-helper.mjs` — the local credential helper (macOS Keychain).
- `templates/` — the setup artifact formats.
- `qa/verification-checklist.md` — plan and runtime release gate.

### When something breaks

- **Site redirects to an unexpected host:** stop and ask the user to confirm the
  canonical site; never authorize the redirect target automatically.
- **MoonPress Chat is absent:** install only from a verified official distribution; if
  none is available, record `blocked-official-package`.
- **Version/runtime is below the documented floor:** stop before configuration
  and record the exact compatibility blocker.
- **Public pages block research:** list the documents needed from the owner; do
  not bypass the control; label any deliberately supplied fallback material
  `owner-supplied`.
- **User offers a password or key in chat:** ask them not to send it and use the
  approved human entry surface instead.
- **The credential backend is unsupported (Windows/Linux):** the helper exits
  `credential-backend-unsupported`; use the guided path with that reason.
- **The compatibility endpoint answers 404:** the plugin is absent, inactive,
  or older than MoonPress Chat 1.0.0 (still on the old REST namespace); use
  the guided path with `reason: plugin-predates-api`.
- **The compatibility gate does not pass** (multisite, missing capability,
  wrong schema version, origin mismatch): make no WordPress write through the
  API; use the guided path and record the reason.
- **A 401 appears mid-flow:** the temporary connection expired or was revoked;
  re-read the public compatibility endpoint and ask the owner to re-authorize.
- **A production write is ready:** show the redacted diff and obtain explicit
  approval immediately before the change.
- **A public test fails:** turn visibility off first, confirm the widget is
  absent, then follow the recorded rollback path.

---

_Covers SKILL.md v0.5.0 | Last changelog entry: v0.5.0 | Generated: 2026-09-02._
