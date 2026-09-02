---
name: moonpresschat-setup
description: >
  Install or set up MoonPress Chat on a WordPress site through a safe six-stage
  workflow: preflight, research, owner questions, connect, configure, and
  verify. Defaults to the shipped MoonPress Chat setup API with a local credential
  helper; keeps the guided WordPress-admin path as the documented fallback.
  Use when a site owner asks to install, plan, configure, review, or launch
  MoonPress Chat without exposing WordPress passwords or AI-provider keys to the
  agent.
metadata:
  version: "0.5.0"
  author: "Norml Studio"
---

# MoonPress Chat setup

Guide a WordPress site owner from public-site research to a reviewed MoonPress Chat
configuration. Keep human credentials out of the AI conversation and make every
production change explicit and reviewable.

## When to use

- "Set up MoonPress Chat on my WordPress site."
- "Research my site before configuring MoonPress Chat."
- "Help me plan the MoonPress Chat knowledge base."
- "Connect this WordPress site to the MoonPress Chat setup flow."
- "Review whether MoonPress Chat is ready to go live."
- "Resume my MoonPress Chat setup."

## Do not use

- For general WordPress administration outside MoonPress Chat.
- To obtain, rotate, or expose an AI-provider secret.
- To enable paid MoonPress Chat capabilities that the account does not own.
- To bypass WordPress capabilities, nonces, consent, or a human approval step.
- To write through SSH, direct database access, or undocumented plugin internals.

## Current release state

Version 0.5.0 is a public alpha with two complete setup paths. It speaks
the MoonPress Chat 1.0.0 contract; see the compatibility note below.

- The **API path is the default**: MoonPress Chat ships its stable public setup API
  (`moonpresschat/v1/setup`, API version 1.0, MoonPress Chat 1.0.0+), and this skill ships
  the local credential helper (`helper/moonpresschat-setup-helper.mjs`) that holds the
  temporary WordPress Application Password in the macOS Keychain. The agent
  composes non-secret JSON envelopes and reads non-secret responses; it never
  sees a credential.
- The path is chosen by the public `GET /setup/compatibility` gate, not by a
  version string: `available: true`, `"1.0"` in `schema_versions`, and the
  required capability list. See `contracts/current-api-contract.md`.
- The **guided wp-admin path remains fully supported** as the fallback: for
  multisite (the API refuses it by design), a plugin older than MoonPress
  Chat 1.0.0 (its compatibility endpoint answers 404 — see below), an owner
  who declines the helper, or a platform without a supported credential
  backend (the helper is macOS-only in this release).
- **Compatibility floor: MoonPress Chat 1.0.0 or newer.** The plugin
  restarted its version numbering with the new name and renamed every
  internal identifier; 4.8.0 was the last release under the old name and
  still speaks only the old REST namespace. Skill 0.4.0 pairs with plugin
  <= 4.8.0, skill 0.5.0 pairs with plugin >= 1.0.0; any other pairing simply
  fails the compatibility gate and takes the guided path.
- The plugin's internal `moonpresschat/v1/admin` routes are still not a public
  contract; the setup credential cannot reach them, and the skill never calls
  them.
- The free MoonPress Chat core is free forever and requires no moonpresschat.com account or license.
  The site owner connects and pays a supported AI provider directly.
- MoonPress Chat Pro and provider inference are separate purchases. Never imply that the
  $200/year Pro license includes AI usage. No Pro-activation or `/license/*`
  operation exists in the shipped setup API; never present one as available.

## Inputs

Required:

- Canonical public WordPress site URL.
- Confirmation that the user owns or is authorized to manage the site.
- A writable local folder for the setup artifacts.
- The target environment: staging or production.

Collected during the workflow:

- Business purpose, audiences, questions, exclusions, and escalation rules.
- Public source pages to include or exclude.
- Provider and model choice, but never the provider key itself.
- Consent, disclosure, contact, tone, and go-live decisions.

Optional:

- Staging URL.
- Existing FAQ, policy, handoff, or support documentation.
- Prior MoonPress Chat setup artifacts to resume.

## Output folder

Create or reuse `moonpresschat-setup/` in the user's chosen working directory:

```text
moonpresschat-setup/
├── preflight.md
├── research.md
├── owner-answers.md
├── configuration-plan.md
├── configuration-envelope.json   # API path only: the non-secret envelope sent to validate/apply
└── verification.md
```

Never write a credential, token, reset link, Application Password, or provider
key into these files.

## Start from the MoonPress Chat onboarding page

The plugin's Setup page may link to this public repository. If the skill is not
installed, ask the human to run this in their own terminal:

Install only this skill for the agent the human uses:

```bash
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a claude-code
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a codex
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a gemini-cli
```

Run one command, not all three. Replace the final agent id only when the open
`skills` CLI names a different supported runtime.

The current open `skills` installer requires Node.js 22.20 or newer. If the
command reports an engine-version error, stop and ask the human to update Node
through their normal developer-tooling process; do not install or replace their
runtime without approval.

Then ask them to start a new agent turn with:

```text
Use moonpresschat-setup to set up MoonPress Chat on https://example.com
```

Do not put a WordPress password, provider key, Application Password, or secret
URL into that command or the conversation.

## The credential helper

The API path runs through `helper/moonpresschat-setup-helper.mjs`, shipped inside this
skill. It is a single-file Node.js (>= 22.20, the same floor as the installer)
ESM script with zero npm dependencies, and it is the only component that ever
touches the WordPress Application Password.

```bash
node helper/moonpresschat-setup-helper.mjs connect https://example.com
node helper/moonpresschat-setup-helper.mjs status https://example.com
node helper/moonpresschat-setup-helper.mjs call https://example.com POST /setup/validate --body moonpresschat-setup/configuration-envelope.json
node helper/moonpresschat-setup-helper.mjs provider https://example.com openai gpt-5-mini   # human's own terminal; key typed with echo off
node helper/moonpresschat-setup-helper.mjs disconnect https://example.com
```

- Credentials live in the macOS Keychain (`moonpresschat-setup:<origin-slug>`); the
  non-secret connection record lives at `~/.moonpresschat-setup/<origin-slug>.json`.
- On Windows and Linux the helper exits with
  `credential-backend-unsupported`; use the guided path there.
- The generic `call` bridge refuses absolute URLs, any path outside `/setup`,
  and `PUT /setup/provider` (the provider secret goes only through the
  `provider` subcommand's own TTY prompt).
- Exit codes: 0 success (HTTP 2xx), 1 HTTP/contract failure, 2 usage or
  platform error.

## Workflow

### 0. Preflight and installation

Read `actions/preflight.md` and `contracts/installation-and-rollback.md`.

Before researching or changing WordPress, explicitly confirm management
authority, canonical origin, artifact folder, target environment, backup state,
and whether MoonPress Chat is installed and active. When the site is reachable, the
public `GET /setup/compatibility` endpoint answers the plugin version,
availability, and capability questions without asking the human. The guided
path's screen-by-screen guidance is verified against MoonPress Chat 3.11.0; the API
path's contract is verified against MoonPress Chat 1.0.0 and requires 1.0.0 or
newer. Against an older plugin (4.8.0 and earlier, still on the pre-1.0.0
namespace) `GET .../moonpresschat/v1/setup/compatibility` answers 404, and the
skill takes the guided path with `reason: plugin-predates-api` — exactly as it
does whenever the API is unavailable. Stop on an incompatible WordPress/PHP
runtime.

If MoonPress Chat is absent, the human may install it only from a verified official
distribution. Do not guess a package URL, use an arbitrary mirror, or claim a
WordPress.org listing exists. If no official package is available to the owner,
record `installation: blocked-official-package` and stop before configuration.

On production, require a human-confirmed restorable backup before any change.
Keep the public widget off. Record the rollback and immediate-disable path.

### 1. Research

Read `actions/research.md` and `templates/research.md`.

Research only public pages. Build a cited picture of the business, audience,
services, recurring questions, contact paths, policies, and important gaps.
Write `moonpresschat-setup/research.md` before asking the owner to repeat facts already
published on the site.

### 2. Owner questions

Read `actions/questions.md` and `templates/owner-answers.md`.

Ask only for decisions or private operating context that public research cannot
answer. Work in short batches. Record explicit answers and mark unresolved
items; do not fill gaps with guesses.

### 3. Connect

Read `actions/connect.md`, `contracts/security-model.md`, and
`contracts/current-api-contract.md`.

When the compatibility gate passes and the owner agrees to the helper, connect
through `node helper/moonpresschat-setup-helper.mjs connect <origin>`: the system
browser opens WordPress core's Application Password consent screen, the owner
signs in and approves, and the helper stores the credential in the macOS
Keychain before printing a redacted summary. Record `connection: api` plus the
advertised connection policy, and warn the owner that the whole run has a
two-hour hard ceiling and a 30-minute idle timeout.

Otherwise record `connection: guided-manual` with an explicit `reason`
(`multisite`, `plugin-predates-api`, `owner-declined-helper`, or
`credential-backend-unsupported`) and follow
`contracts/admin-guided-path.md`. The provider key stays write-only in either
path.

### 4. Configure

Read `actions/configure.md`, `contracts/current-api-contract.md`,
`contracts/configuration-fields.md`, `contracts/admin-guided-path.md`, and
`templates/configuration-plan.md`.

Map the approved research and owner answers to MoonPress Chat settings, knowledge,
consent, handoff, provider choice, appearance, and launch gates, then show the
reviewed plan and ask for explicit approval.

On the API path: build the configuration envelope from the approved plan,
`call POST /setup/validate`, show the returned summary and warnings, and only
after the owner's explicit approval `call POST /setup/apply` with
`approval.confirmed: true` and `approval.artifact_sha256` equal to the
`configuration_sha256` the validate response returned. When the `interview`
capability is advertised, run the interview stage first: GET the questions,
ask the owner in chat, PUT the answers, GET the preview, and fold the
preview's envelope into the configuration envelope. Apply never changes
visibility.

The provider key is entered by the human — through the helper's `provider`
subcommand in their own terminal (API path) or in MoonPress Chat's write-only
settings field (guided path). Never through chat.

On the guided path, direct the human through the exact MoonPress Chat screens and ask
them to confirm only non-secret status. Never ask them to paste a provider key
or authenticated screenshot.

### 5. Verify

Read `actions/verify.md` and `qa/verification-checklist.md`.

On the API path, `call POST /setup/verify` drives the automated checklist
rows; behavior tests still run through the human-observed preview. Go-live is
`call POST /setup/go-live` only after every blocking checklist row passes AND
the owner's explicit, separately recorded approval. A successful go-live
revokes the setup connection (`connection_revoked`), so no disconnect step
follows it.

On the guided path, verify the human-confirmed setup as before. Cover provider
test status without the key, knowledge, consent, test-chat behavior,
escalation, privacy, and the preview widget. Keep the bot off until the user
explicitly approves go-live. Treat every checklist row marked `blocking` as a
release gate. If a post-launch check fails, first turn visibility off, then use
the recorded rollback path (API path: `POST /setup/rollback` restores the
apply snapshot; it never restores a provider secret).

Write the result to `moonpresschat-setup/verification.md` with `pass`, `fail`, `blocked`,
or `not-applicable` for every check.

## Security contract

- Never ask for a WordPress password, Application Password, provider key, moonpresschat.com
  token, license key, payment key, or reset link in chat.
- Never print, log, screenshot, or save secret-bearing URLs or response bodies.
- Open a system browser only for human login and consent; never automate it.
- In guided mode, the human uses the existing authenticated wp-admin session and
  enters provider secrets directly into MoonPress Chat's write-only field.
- In API mode, the released helper is the only component that touches the
  Application Password (macOS Keychain) and the provider key (TTY prompt with
  echo off). The agent composes non-secret envelopes and reads non-secret
  responses only.
- Use WordPress capabilities and the published MoonPress Chat setup API; never SSH or SQL.
- Treat provider keys as write-only. Automation may inspect `has_key`, provider,
  model, and test status only.
- Require explicit approval immediately before any production write or go-live.
- Fail closed: stop on `moonpresschat_setup_unknown_field` or
  `moonpresschat_setup_unsupported_schema` rather than retrying mutated envelopes;
  treat a mid-flow 401 as an expired connection, re-read the public
  compatibility endpoint, and ask the owner to re-authorize.
- Abort on an unexpected hostname, redirect, TLS error, capability failure, or
  API-version mismatch.
- Never install a plugin package from an unverified mirror, attachment, or URL
  invented by the agent.
- On production, do not change MoonPress Chat until the human confirms a restorable
  backup; failed post-launch behavior returns visibility to off first.

## Outputs

- A cited public-site research artifact.
- An owner-answer record that separates decisions from assumptions.
- A field-by-field configuration plan with source and approval state.
- On the API path, a non-secret configuration envelope with the server-issued
  fingerprint, apply ID, rollback ID, and idempotency key recorded.
- A verification report that exposes every blocker.
- An installation, environment, backup, and rollback preflight record.
- No credentials and no hidden production side effects.

## Related material

- `contracts/security-model.md` — credential and consent boundaries.
- `contracts/current-api-contract.md` — the shipped setup API surface.
- `contracts/admin-guided-path.md` — the fallback human-operated wp-admin sequence.
- `contracts/installation-and-rollback.md` — cold-start, compatibility, backup,
  and recovery gates.
- `contracts/configuration-fields.md` — field-level map (guided labels 3.11.0;
  envelope mapping 1.0.0).
- `helper/moonpresschat-setup-helper.mjs` — the local credential helper.
- `qa/verification-checklist.md` — release gate for a configured installation.
