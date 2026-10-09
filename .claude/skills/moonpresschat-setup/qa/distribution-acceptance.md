# Marketplace candidate acceptance — updated 2026-10-09

Author: Artur Tsitou. Candidate: 0.6.0; plugin issue #211, skill issue #2.

| Check | Result | Evidence / boundary |
|---|---|---|
| Public package and version consistency | Pass | `bash scripts/validate-package.sh`; one authority in plugin.json |
| Minimum/recommended, legacy fallback, malformed floors | Pass | Node contract suite, including numeric semver |
| Optional client header / idempotency | Pass | Mocked HTTP verifies headers, route and redirect refusal |
| Generic bridge traversal / provider route | Pass | Encoded paths, traversal, query overrides and secret-route bypass refused |
| Update notice once | Pass | Non-secret temporary state; second invocation prints nothing |
| Claude marketplace/plugin manifests | Pass | `claude plugin validate .` and explicit plugin.json both accepted |
| Codex local candidate install | Pass | `codex plugin marketplace add <candidate-path>` then `codex plugin add moonpresschat@moonpresschat`; installs 0.6.0 |
| Codex local version selection/recovery | Pass | Isolated temporary config: candidate manifest 0.6.0 → 0.6.1 installs new cache; remove/reinstall after reset recovers 0.6.0 |
| Git marketplace add/install/upgrade | Pass | Isolated Codex config, remote feature branch: all three CLI commands succeed; version-changing upstream verified in the Oct 7 isolated HTTP Git fixture below |
| Desktop restart auto-update | Pending | No desktop restart/update acceptance claimed |
| New Codex-specific manifest | Not needed | Codex installs the shared `.claude-plugin` manifests successfully |
| Generated guide at 1200px and 390px | Pass | Playwright, existing Chromium 1234; no overflow or console/page errors; screenshots reviewed with reduced motion |
| Skill-folder names / portable paths | Pass | Shared Norml lints |
| Desktop ZIP install and local Code setup | Pass for original candidate | Artur’s Oct 7–9 screenshots/report and local verification artifacts; existing Mac, plugin 5.9.1, mocked provider; Oct 9 instruction revisions not yet rerun in Desktop |
| Clean Mac marketplace install and Chat/Cowork stop | Pending | ZIP is not marketplace acceptance; unsupported surfaces still need human observation |
| Release-only main protection | Pass | GitHub readback Oct 7: PR + strict validate check required, admins enforced, force pushes/deletions disabled; main remains default |
| Release promotion guard | Pass locally | Main PR must originate from develop and increase the released version; legacy 0.5.0 supported |
| Tagged release CI | Pending | Workflow prepared; no public tag/release publication performed |
| Non-release branch isolation | Pass for tested CLIs | Codex, Claude Code and Skills CLI ignore fixture develop and scratch changes; Desktop channel remains pending |

The local update fixture changed only a temporary manifest, not this repository
or a published tag. The check proves CLI version selection and recovery;
it does not establish upstream Git auto-update or WordPress setup completion.
Existing personal installations, credentials and model keys were not used.

Independent Codex review of candidate `48d85fc` found four defects despite
nine passing exported-function tests: missing CLI wiring, silent symlink entry,
incomplete version stamps, and custom-home update-channel detection. The
coordinator corrected all four and added real child-process mock-server tests,
symlink preflight, configured runtime-home detection, and isolated release-bump
drift checks. **12 tests pass on Node 22.20.0**, along with package validation.
No Keychain, authenticated WordPress, or live provider operation was used.

## Oct 7 automated acceptance

Author: Artur Tsitou. Runtime candidate: `107903a`; tests use its committed
archive, with only fixture version stamps changed. Node 22.20.0, Codex 0.160.1,
Claude Code 2.1.286, macOS. The contract suite now passes **13 tests**.

`tests/marketplace-acceptance.py` is an opt-in integration test. Run with Node
22.20+ on PATH and installed `codex` / `claude` executables:

```sh
python3 tests/marketplace-acceptance.py
```

It creates a temporary Smart HTTP Git upstream and isolated runtime profiles,
runs only plugin-management commands, and retains `result.json` in the printed
temporary directory. It does not launch a model session or use credentials.

Verified with both actual CLIs:

- Install 0.6.0 from the fixture main branch.
- Push fixture develop at 0.6.1; marketplace refresh still installs 0.6.0.
- Promote fixture main and tag v0.6.1; refresh updates to 0.6.1.
- Codex marketplace upgrade refreshes the installed cache without another add.
- Claude marketplace update followed by plugin update selects 0.6.1.
- Remove and reinstall recovers the updated package.
- The installed Codex helper performs public preflight at each version and
  emits the update notice only on the first invocation of that version.

This establishes version-changing HTTP Git refresh with real CLIs. It does
**not** establish Claude Desktop restart auto-update, public GitHub release
publication, or authenticated setup. The local fixture tags are not product
releases. No public v0.6.0 or v0.6.1 tag was created for this check.

## Remaining human and release gates

Artur agreed to test Claude Desktop Code and Chat/Cowork. The candidate remains
in draft PR #4 until the required user-surface evidence is recorded:

1. Marketplace installation and a complete local Code setup on a disposable
   WordPress, with human browser consent and configuration approval.
2. Restart auto-update and one-time notice on the installed Desktop channel.
3. Chat and Cowork refuse setup before any site request and direct to local Code.
4. Confirm Desktop non-release isolation; CLI branch isolation now passes.
5. Release promotion, tagged artifact verification and public release readback.

The plugin-side compatibility fields, setup-card states and unpublished-minimum
CI guard belong to plugin issue #222. Plugin 5.9.1 still exercises the legacy
compatibility path; this document does not claim #222 is implemented.

## Oct 9 owner acceptance and usability corrections

Author: Artur Tsitou. Tested package: candidate `d072d64`, uploaded as ZIP in
Claude Desktop, listed as 0.6.0 with one skill and enabled. Installation using
GitHub URL plus a feature-branch fragment previously failed in the Desktop UI.
The cause was not proven; the public default main has no marketplace manifest.
Do not repeat that branch-fragment URL as a verified Desktop route.

Artur ran local Code with a disposable WordPress 5.9.1 plugin fixture. Evidence:
human screenshots and report, plus the task workspace's `verification.md` read
on Oct 9. The report records interview → validate → owner-approved apply B →
provider test → eight blocking API checks passed → disconnect, with both server
revocation and local credential removal reported. Public visibility stayed off.
The agent reused installed Node 22.22.2 after finding Node 20 on the default path.

The fixture maintainer independently confirmed `acceptance-transport.php` is a
loaded MU plugin and visibility is false. It intercepts Anthropic responses and
mail intentionally. This establishes setup/authentication/API behavior, not a
real provider key, model answers, email delivery, or production readiness.
No credentials, callback URLs, session records or private site data are copied
into this public evidence document.

Owner feedback exposed instruction defects now corrected in this candidate:
repeated decisions, raw technical summaries, an invented free-language cap,
and offering a known contradictory preset variant alongside a corrected one.
`contracts/owner-experience.md` specifies the corrected conversation and its
acceptance examples. These are reviewed instructions, not evidence of a second
Desktop model run; the original owner run predates these changes.

### Why preset contradictions survived

Read-only source inspection of plugin 5.9.1 found that
`moonpresschat_interview_assemble()` starts with source fields and appends pricing,
billing and FAQ answers. It preserves topic subtitles. The default preset
already claims pricing depends on a request and staff read every conversation.
`/setup/validate` validates structure, not business truth, so it does not remove
these contradictions. The skill now reviews the complete editable envelope,
including subtitles, before the one approval. It must not mutate locked rules
or rewrite unrelated owner content. Plugin composer behavior is unchanged by
this skill-only change; a generic semantic rewrite is not a safe PHP fix.

The completed offline setup does not require the owner to repair fake mail or
retest a mock AI provider. Marketplace/restart and unsupported-surface gates
below still cannot be inferred from it.

## Oct 9 automated checks and review

- Package validation and all 13 Node tests pass on Node 22.20.0.
- Claude marketplace manifest validates. Skill folder-name and portable-path
  lints pass; no secret-shaped values or personal filesystem paths in package.
- Regenerated human guide inspected at 1200px and 390px: no horizontal overflow,
  console errors or page errors. Existing Chromium 1234 used.
- Expanded `tests/marketplace-acceptance.py`: actual Codex/Claude marketplace
  installs ignore both develop and scratch branches, update to promoted main,
  and recover after removal. Installed helper notices remain once per version.
- With `MOONPRESSCHAT_TEST_SKILLS_CLI` pointing to an installed Skills CLI entry,
  the same harness verifies project-scope installation and unreleased-branch
  isolation. It uses a temporary HTTP Git remote and never installs globally.
  Runtime source for this run was committed `d072d64`; new instruction text is
  separately package-validated, not claimed as a new Desktop behavior run.
- Skills CLI 1.5.24, invoked from Codex, reported successful update while leaving
  the Claude copy unchanged. The shared copy advanced. Explicit-target scoped
  reinstall then updated the Claude copy to 0.6.1, verified from installed text.
  The report records this as a limitation plus tested recovery, not an automatic
  update pass. `contracts/distribution-and-updates.md` documents the recovery.
- Review: no new credential access, site writes, changed connection lifetimes or
  weakened apply/go-live gates. The only executable change extends the isolated
  integration harness. Usability changes are instructions; model adherence still
  requires observation and must not be inferred from unit tests.

Local report is retained by the harness as `result.json`; its absolute temporary
path is intentionally not part of this public package. The public first-release
and Desktop gates remain open. No tag or production rollout was performed.
