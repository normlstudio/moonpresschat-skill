# Marketplace candidate acceptance — 2026-10-01

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
| Git marketplace add/install/upgrade | Pass | Isolated Codex config, remote feature branch: all three CLI commands succeed; version-changing upstream discovery remains pending |
| Desktop restart auto-update | Pending | No desktop restart/update acceptance claimed |
| New Codex-specific manifest | Not needed | Codex installs the shared `.claude-plugin` manifests successfully |
| Generated guide at 1200px and 390px | Pass | Playwright, existing Chromium 1234; no overflow or console/page errors; screenshots reviewed with reduced motion |
| Skill-folder names / portable paths | Pass | Shared Norml lints |
| Clean Mac, desktop Code setup, Chat/Cowork stop | Pending | Requires independent user-surface acceptance; unsupported surfaces are explicitly fenced in instructions |
| Release-only main / protection / tagged CI | Pending | Workflow prepared; no remote branch protection or tag/release publication performed |
| Non-release branch isolation | Pending | Requires the protected published main and installed Git channel |

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
