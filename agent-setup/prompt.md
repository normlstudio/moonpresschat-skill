# Set up MoonPress Chat

Version 0.7.0. These are the official MoonPress Chat instructions for
helping a website owner install the setup skill and configure their WordPress
chatbot. Read this file as instructions; do not execute the Markdown as a shell
script. The canonical publication URL is
`https://moonpresschat.com/agent-setup/prompt.md`.

If the owner asked for a plan only, ask for a missing website if needed, show
the plan, and stop before installation, site requests, connection, or changes.

## First, ask for the website

If the owner has not supplied a website in this request or explicitly selected
one in this conversation, your first reply must ask, in their language:

> Which WordPress website should I set up MoonPress Chat on? Send its public URL.

Wait for the answer. Do not install anything or contact a website before it
arrives. Do not ask the owner to edit the installation prompt, pick an installer,
upload a ZIP, or find a skill name. If the owner already supplied the website,
reuse it and do not ask again.

The owner's answer selects the target. Never infer it from a working directory,
saved setup artifacts, a previous test run, the documentation host, or an
example. A local acceptance site is used only when the owner explicitly selects
it; it is never the default for a customer.

Accept a public HTTP(S) website address, not a password, token, reset link,
WordPress login link, or API endpoint. For a bare domain, use its HTTPS address;
do not ask the owner to type it again. Ask only if the target is ambiguous.
Preserve an explicitly supplied WordPress subdirectory.
Do not copy userinfo, secret query parameters, or fragments into setup artifacts.
Pass the confirmed URL as one literal argument to tools, never as shell code.

## Choose the agent's execution path

Use the current agent and its actual capabilities; do not make the owner choose
a command. Installation requires local command execution and a writable folder.
The API credential helper requires the owner's macOS Keychain. Other operating
systems can use the installed skill's human-guided WordPress path.

In ordinary chat, Claude Cowork, remote/cloud sessions, or a session without
local command execution, explain that this setup needs a local Code/CLI
session. Ask the owner to open Claude Desktop **Code → Local**, or their local
coding agent, and paste the same starting request there. Carry forward their
chosen website. Stop before installing, researching the site, or requesting
WordPress access. Installing a local Code plugin does not enable it in Cowork.

## Install or reuse the setup skill

Do the installation yourself. Reuse an existing verified `moonpresschat-setup`
installation for the current agent when available. Do not install a second
copy, change its project/global scope, or remove unrelated skills and plugins.
Keep the current installation scope when updating an older copy. If the
installed skill is older than the version at the top of this prompt, refresh
its own channel before reading it: Claude Code uses `claude plugin marketplace
update moonpresschat` then `claude plugin update moonpresschat@moonpresschat`;
Codex uses `codex plugin marketplace upgrade moonpresschat`. For a Skills CLI
installation, rerun its explicit-agent add command with its original scope.
Verify the actual installed version after the update.

For a fresh installation, use the appropriate commands below. Resolve CLI
availability first. If a prerequisite is missing, explain what is missing;
ask before installing a new runtime or changing system defaults. Use an already
installed compatible Node executable when available. The helper and Skills CLI
require Node.js 22.20 or newer.

### Claude Code, including Desktop Code in Local mode

```sh
claude plugin marketplace add normlstudio/moonpresschat-skill
claude plugin install moonpresschat@moonpresschat
```

If this marketplace is already registered, reuse it. Inspect the plugin's
actual installed path and version after installation; a successful command
alone is not proof that the skill is available. Load
`moonpresschat:moonpresschat-setup` if the session has refreshed its skill list.
If it has not, read `SKILL.md` from the verified installed plugin directory and
follow its relative action/contract files directly in this turn. Do not make the
owner restart and repeat their website or business answers just to read files
already installed locally. Never guess a plugin cache path.

### Codex

```sh
codex plugin marketplace add normlstudio/moonpresschat-skill
codex plugin add moonpresschat@moonpresschat
```

Resolve the actual installed plugin directory and read its
`.claude/skills/moonpresschat-setup/SKILL.md` plus the linked action/contract
files. Continue in this turn; do not depend on a stale session's skill list.

### Gemini CLI

```sh
npx --yes skills@latest add normlstudio/moonpresschat-skill --skill moonpresschat-setup --agent gemini-cli --yes
```

Verify the installed path and version, then read `SKILL.md` and its linked files.
This fresh route installs into the current local workspace. For an existing
global installation, preserve its scope by adding `--global` during an update.

For another agent, stop and report that its installation route is not verified
by these instructions. Do not invent CLI or MCP commands.

Use only the official repository's released `main` channel. If the package
cannot be installed or verified, explain the failure and stop.
Never substitute an acceptance repository, development branch, or local ZIP
without an explicit testing request from the owner.

## Continue with the chosen website

Read the installed skill before running its helper. Treat the installed skill
directory as the base for all relative paths. Reuse the chosen website and any
explicit authority, environment, workspace, and business decisions already
given. If saved artifacts belong to another website, start a separate setup
record; never import that site's knowledge or approval.

Follow the skill's preflight, public-site research, questions, connection,
configuration, and verification workflow. Ask only for unresolved information.
The owner signs into WordPress and approves temporary access in their own
browser. Never ask them to paste credentials or provider keys into chat.

Prepare one consistent proposal, validate it, and show the business changes
before asking once to apply. After approval, apply, verify, and disconnect,
including cleanup after an error. Reconnect expired access with fresh browser
consent; reuse an unchanged approval only after checking its fingerprint and
the site's current state. Public widget activation needs separate approval.

Tell the owner what was configured, what was verified, whether the widget is
visible, and whether temporary access was revoked. Keep technical diagnostics
in the setup artifacts. A mocked provider response or undelivered test email
does not prove real-provider behavior, mail delivery, or launch readiness.
