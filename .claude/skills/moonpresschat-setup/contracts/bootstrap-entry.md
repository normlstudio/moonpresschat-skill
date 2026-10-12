# Public URL entry

Author: Artur Tsitou. Updated: Oct 12, 2026.

## Owner experience

The primary installation entry is one request without a required site argument:

```text
Fetch and execute the appropriate instructions to set up MoonPress Chat from https://moonpresschat.com/agent-setup/prompt.md
```

The agent reads the public instructions and asks for the owner's WordPress
website if it has not already been explicitly supplied. It waits for the answer,
chooses its own verified local installation route, reads the installed skill,
and continues in the same turn when its tools allow it. The owner does not need
to know the plugin identity, run installation commands, or upload a ZIP.

The canonical source is `agent-setup/prompt.md` at the repository root. The
website serves those exact released bytes at the URL above as UTF-8 plain text,
with no login, consent wall, HTML wrapper, or long-lived stale cache. Its source
must be included in the release archive. Verify the production response and
checksum against the released main commit before advertising the URL as live.
Preparing this source does not publish the URL or promote the release.

## Target selection and resume

- The user's supplied website is required; never default to a local fixture,
  the MoonPress Chat documentation site, or a saved artifact's origin
- Reuse a website explicitly selected in the conversation; do not ask twice
- A bare domain needs confirmation of the proposed HTTPS address; keep an
  explicitly selected WordPress subdirectory
- Existing artifacts may be resumed only when they belong to that chosen site
- A plan-only request stops before installation or site requests
- Existing authority and business decisions remain reusable only for their
  actual site; approval and credentials never transfer between customers

## Execution and distribution

Local Claude Code and Codex use the official marketplace. Gemini CLI uses its
explicit-target Skills CLI route. Resolve the actual installed directory and
read its `SKILL.md` directly when the current skill list is stale. Reading the
installed instructions is not a claim that a runtime hot-reload occurred.

Reuse verified installs, preserve their scope, and do not remove unrelated
plugins. The released main branch is the customer channel; acceptance versions
and development branches require an explicit testing request. Installation
does not grant WordPress access or configuration approval. OS/runtime limits
and all setup authorization boundaries remain in force.

Ordinary Chat, Cowork and cloud sessions read the public prompt but direct the
owner to local Code/CLI before any website request. They do not need an account
plugin installed just to explain this routing. This replaces the previous
primary-entry test that required installing the skill in Cowork first. The
advanced installed-skill refusal remains a separate check when that skill is
actually available in an unsupported surface.

## Acceptance

| Case | Required result |
|---|---|
| Entry request contains no site | First reply asks for the WordPress public URL; waits before installation or site requests |
| Entry request already selects a site | Reuses it; no repeated URL question |
| Old artifacts refer to another site | Does not select that origin or reuse its knowledge, credentials or apply approval |
| Local Code skill list is stale | Reads the verified installed files and continues without a forced restart |
| Chat or Cowork fetches the prompt | Directs to local Code/CLI; no website request or authentication |
| Main has no published marketplace | Reports publication pending; does not use the acceptance fixture |
| Owner requests only a plan | No installation, connection or writes |
| Setup completes | Reviewed apply, honest verification limits and disconnect; no automatic go-live |

Prompt/package validation cannot prove a model follows these instructions.
Observe the no-site and preselected-site cases in an actual agent session,
then verify the public URL and a fresh install from the released channel.
