# Public setup release 0.7.0

Author: Artur Tsitou. Published and verified on Oct 13, 2026.

The owner authorized publishing the Cloudflare-style entry on the product site.
The starting request contains no customer website:

```text
Fetch and execute the appropriate instructions to set up MoonPress Chat from https://moonpresschat.com/agent-setup/prompt.md
```

The released instructions require the agent to ask for the WordPress public URL
first when none was supplied. The chosen website is explicit; a saved setup,
working directory or local acceptance fixture cannot select it. The supported
automated path uses a local coding agent. Chat/Cowork directs the owner to local
Code before installation or site requests.

## Released source and artifacts

| Surface | Verified result |
|---|---|
| Integration | [PR #6](https://github.com/normlstudio/moonpresschat-skill/pull/6), squash commit `783a8edc3dd7de17769eaf2e192cc03856856932` on develop |
| Main promotion | [PR #5](https://github.com/normlstudio/moonpresschat-skill/pull/5), commit `0ca8bd815c7cae0183710cd2f8c404fb5f2d5e69` |
| Release | [v0.7.0](https://github.com/normlstudio/moonpresschat-skill/releases/tag/v0.7.0), tagged at that main commit |
| Release workflow | [Run 38379301964](https://github.com/normlstudio/moonpresschat-skill/actions/runs/38379301964), succeeded |
| Download | `moonpresschat-setup-v0.7.0.zip` and its checksum asset downloaded from the release; ZIP integrity and manifest version verified |
| Public instruction | [Product URL](https://moonpresschat.com/agent-setup/prompt.md), HTTP 200, `text/plain`, no redirect or login; body identical to the released ZIP and tag |
| Product homepage | HTTPS HTTP 200 after publication |

ZIP SHA-256:
`140aab0abfba2da0d80ad77d027dda02d907881d615c0bc500ad093e85a61738`.

Prompt SHA-256:
`b27ea245f146b7ba5c2eebeac544dcebc20eb687168f2cca7884ede701843f2e`.

Only the released `agent-setup/prompt.md` and scoped `.htaccess` were added to
the product web root. The target directory was previously absent. An absence
checkpoint and hashes were saved outside the web root before publication;
rollback removes only these new files and the directory if empty. No WordPress
database, plugin, theme, root server configuration or customer site changed.

## Fresh public-source installation

All commands below ran successfully against the official released main in
separate temporary runtime profiles or workspaces. The installed `SKILL.md`
version was 0.7.0 and its linked helper/contracts were present. No model session,
WordPress connection, provider request or Keychain credential was used.

| Runtime | Channel | Result |
|---|---|---|
| Claude Code | `claude plugin marketplace add normlstudio/moonpresschat-skill`, then `claude plugin install moonpresschat@moonpresschat` | Pass |
| Codex | `codex plugin marketplace add normlstudio/moonpresschat-skill`, then `codex plugin add moonpresschat@moonpresschat` | Pass |
| Claude Code | `npx --yes skills@latest add normlstudio/moonpresschat-skill --skill=moonpresschat-setup -a claude-code --yes` | Pass |
| Codex | Same Skills CLI command with `-a codex` | Pass |
| Gemini CLI | Same Skills CLI command with `-a gemini-cli` | Pass |

The final source passed 13 Node contract tests, package/version validation,
portable-path and skill-folder lints. Generated human docs were rendered at
375, 768, 1024, 1440 and 1920px: no horizontal overflow, page/console errors or
external requests. The 375px and 1440px screenshots were visually inspected.

## Acceptance boundaries

- The published prompt was fetched and compared byte-for-byte through local
  HTTPS tools. This session's cloud browsing adapter could not fetch the product
  host, including its homepage; cloud/chat fetch acceptance is not claimed.
- The first missing-website question and the preselected-website continuation
  are instruction requirements, not an observed fresh model-run result.
- Desktop restart automatic updates and Desktop non-release branch isolation
  still require user-surface observation. The prior isolated CLI tests are
  retained in the distribution acceptance history.
- Earlier disposable-site setup evidence used a mocked provider and mail
  transport. Real-provider replies, delivered email, browser behavior and
  public launch readiness remain separate checks.

This evidence update lives on develop after the release. The main commit,
published tag, archive and production prompt remain the verified release tree.
