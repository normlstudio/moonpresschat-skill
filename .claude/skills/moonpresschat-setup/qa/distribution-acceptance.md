# Marketplace candidate acceptance — updated 2026-10-07

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
| Clean Mac, desktop Code setup, Chat/Cowork stop | Pending | Requires independent user-surface acceptance; unsupported surfaces are explicitly fenced in instructions |
| Release-only main protection | Pass | GitHub readback Oct 7: PR + strict validate check required, admins enforced, force pushes/deletions disabled; main remains default |
| Release promotion guard | Pass locally | Main PR must originate from develop and increase the released version; legacy 0.5.0 supported |
| Tagged release CI | Pending | Workflow prepared; no public tag/release publication performed |
| Non-release branch isolation | Partial | Actual Codex and Claude CLI marketplace refresh ignores fixture develop changes; Desktop, scratch branch and Skills CLI acceptance remain pending |

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
4. Complete non-release branch isolation across the approved channels.
5. Release promotion, tagged artifact verification and public release readback.

The plugin-side compatibility fields, setup-card states and unpublished-minimum
CI guard belong to plugin issue #222. Plugin 5.9.1 still exercises the legacy
compatibility path; this document does not claim #222 is implemented.
