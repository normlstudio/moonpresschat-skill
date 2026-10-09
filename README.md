# MoonPress Chat setup

0.6.0 release candidate. Marketplace publication and independent desktop
acceptance are pending; see the [candidate checks](.claude/skills/moonpresschat-setup/qa/distribution-acceptance.md).

`moonpresschat-setup` safely installs, researches, configures, and verifies
[MoonPress Chat](https://moonpresschat.com) on WordPress without exposing a
WordPress password or AI-provider key to the agent.

The skill uses MoonPress Chat's public setup API (`moonpresschat/v1/setup`,
MoonPress Chat 5.0.0 or newer) and a bundled macOS Keychain helper by default.
A human-operated wp-admin path remains available for multisite, plugins older
than 5.0.0, unsupported credential backends, or owners who prefer manual
control.

## Install

Candidate note: the default `main` branch does not contain the marketplace
manifest yet. The commands below describe the release channel and cannot
install this candidate until release promotion. Desktop ZIP upload has been
verified for candidate testing; it does not establish marketplace updates.
Do not give a `#branch` URL as a verified Desktop installation method.

Install from the MoonPress Chat marketplace in a local Code session:

```bash
# Claude Code
claude plugin marketplace add normlstudio/moonpresschat-skill
claude plugin install moonpresschat@moonpresschat

# Codex
codex plugin marketplace add normlstudio/moonpresschat-skill
codex plugin add moonpresschat@moonpresschat
```

In the Claude desktop app, open **Customize → Plugins → Add marketplace**,
add `normlstudio/moonpresschat-skill`, install **MoonPress Chat setup**, and
run it in the **Code** tab with a local folder. Chat and Cowork are unsupported:
stop before contacting or changing the site and ask the owner to open Code.
Desktop labels need verification against the owner's app version.

The Skills CLI remains available (Node.js 22.20 or newer):

```bash
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a claude-code
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a codex
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a gemini-cli
```

Choose the commands for your runtime. Existing Skills CLI installations remain
supported. To switch to Marketplace, remove only this skill with
`npx skills@latest remove moonpresschat-setup -g -a claude-code` (or `-a codex`)
before installing the Marketplace plugin; avoid loading both copies.

Requires Node.js 22.20 or newer. Then start a new agent turn with:

```text
Use moonpresschat-setup to set up MoonPress Chat on https://example.com
```

Use only the public site URL. Never paste a WordPress password, Application
Password, provider key, token, or secret URL into the command or conversation.

## What it does

1. Confirms authority, installation, compatibility, backup, rollback, and
   visibility.
2. Researches public site pages and cites business facts.
3. Collects the owner's unresolved decisions.
4. Connects through WordPress consent while credentials stay outside the
   transcript.
5. Validates and applies an approved, non-secret configuration.
6. Runs readiness, behavior, privacy, and go-live checks.

The package lives at
[`.claude/skills/moonpresschat-setup/`](.claude/skills/moonpresschat-setup/).
Read the [human guide](.claude/skills/moonpresschat-setup/readme.md),
[visual guide](.claude/skills/moonpresschat-setup/readme.html), or
[changelog](.claude/skills/moonpresschat-setup/changelog.md).

## Boundaries

- No browser takeover, SSH, SQL, XML-RPC, or private plugin routes.
- No production configuration before a restorable backup and explicit
  approval.
- No go-live before every blocking verification row passes and the owner
  separately approves publication.
- The free core and AI-provider usage are separate: the site owner pays the
  selected provider directly.

Version 0.6.0 is a public alpha built for MoonPress Chat 5.0.0 or newer (skill
0.4.0 pairs with plugin 4.8.0 and older, which speak a different REST
namespace; mismatched pairs fall back to the guided path). The helper
currently stores credentials only in macOS Keychain; Windows and Linux use the
guided path.

## License

[MIT](LICENSE) © Norml Studio.
