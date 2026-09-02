# MoonPress Chat setup

`moonpresschat-setup` safely installs, researches, configures, and verifies
[MoonPress Chat](https://moonpresschat.com) on WordPress without exposing a
WordPress password or AI-provider key to the agent.

The skill uses MoonPress Chat's public setup API and a bundled macOS Keychain
helper by default. A human-operated wp-admin path remains available for
multisite, older plugin versions, unsupported credential backends, or owners
who prefer manual control.

## Install

Choose the agent you use and run one command:

```bash
# Claude Code
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a claude-code

# Codex
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a codex

# Gemini CLI
npx skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a gemini-cli
```

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

Version 0.4.0 is a public alpha. The helper currently stores credentials only
in macOS Keychain; Windows and Linux use the guided path.

## License

[MIT](LICENSE) © Norml Studio.
