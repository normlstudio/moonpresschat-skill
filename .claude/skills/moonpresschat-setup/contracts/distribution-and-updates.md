# Distribution and compatibility

Author: Artur Tsitou. Version 0.6.0 release candidate, 2026-10-01.

The same public repository serves Claude Code and Codex marketplaces and the
Skills CLI. `.claude-plugin/plugin.json` is the release version authority;
the canonical skill stays in `.claude/skills/moonpresschat-setup/`.
Use `scripts/set-version.sh X.Y.Z`, write the changelog, reconcile the human
guide/data, regenerate the visual guide, and run the validator and tests.
No copied runtime-specific skill is maintained.

The helper checks public `/setup/compatibility` on every run and before
authenticated commands. Missing `setup_skill` retains the original plugin
floor (5.0.0), capabilities and schema gate. Installed below `minimum` routes
to guided wp-admin without an API connection; below `recommended` prints an
update line and proceeds. Invalid floors fail closed. This is a site check,
with no GitHub lookup. Disconnect remains available to revoke an old connection.

The helper adds `X-MoonPressChat-Setup-Client: moonpresschat-setup/X.Y.Z` to
authenticated setup calls. It prints the first changelog bullet once after an
update and stores `last_seen_skill_version` beside its non-secret records.

Update actions depend on the helper's installation path:

- Claude plugin cache: restart the app or `/reload-plugins`. For CLI installs,
  enable auto-update in `/plugin` → Marketplaces → moonpresschat and use
  `/plugin marketplace update moonpresschat` for the immediate update.
- Codex plugin cache: `codex plugin marketplace upgrade moonpresschat`, then restart.
- Other paths: `npx skills@latest update moonpresschat-setup -g`.

After a Skills CLI update, check the installed skill's version in the target
client; a successful command alone is not sufficient. Skills CLI 1.5.24 can
refresh its shared copy but leave a Claude copy stale when invoked from a
Codex agent session. If this happens, rerun the documented scoped installation
for the original target (for example `npx skills@latest add
normlstudio/moonpresschat-skill --skill=moonpresschat-setup -g -a claude-code`)
and verify the target copy before restarting. Preserve the installation scope:
omit `-g` for project installations and run from that project. Never remove
other skills or silently migrate between project/global scope. The isolated
integration harness covers explicit-target reinstall recovery.

Only local Code/CLI sessions are supported. Chat and Cowork stop before any
site request and direct the owner to the local Code tab. Node.js 22.20 or newer
is required; the helper detects an older runtime and gives guidance without
installing or replacing the owner's Node. The credential backend is macOS
Keychain; other systems use guided wp-admin.

Work belongs on `develop` and feature branches. `main` is release-only, remains
the default branch, and requires protected reviewed merges with passing checks.
Protecting branches and publishing tags are repository administration/release
steps, separate from preparing this candidate. Tag CI refuses a version
mismatch or a commit different from current `main`, validates and tests, then
creates an archive from the exact commit and its SHA-256 checksum.

Desktop clean-install, restart/auto-update, non-release branch isolation, and
unsupported-surface behavior require independent acceptance. Do not describe
this local candidate as a published release or claim those checks passed.

Manifest syntax: [Claude Code reference](https://code.claude.com/docs/en/plugins-reference).
Skills CLI update syntax: [upstream README](https://github.com/vercel-labs/skills#skills-update).
