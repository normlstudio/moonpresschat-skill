# Setup 0.8.0 candidate verification

Verified by Iryna Melnyk, 2026-11-11.

## Passed

- All 40 Node tests, including CLI loopback authentication transport, scoped request restrictions, bootstrap cleanup and seven collection cases.
- Package validation, version consistency and diff whitespace checks.
- A disposable WordPress fixture using the official MoonPress Chat 5.11.0 package: collection through the actual CLI and macOS Keychain returned ready; the configured three-page limit survived; the page index was ready; knowledge and provider settings were preserved; visibility stayed off.
- Temporary scoped credentials and Keychain connection were removed. Fixture options and original runtime were restored.
- Independent source review found no remaining release blockers after correcting preservation of existing knowledge and supported installation routing.

## Acceptance limits

This evidence does not certify fresh owner-operated browser consent, Desktop restart/automatic update, unsupported Chat/Cowork handoff, production behavior, paid provider output, or native wizard screen progression. The API workflow collects evidence and prepares reviewed configuration; it does not advance native wizard flags.

The public prompt must be published from the exact release source and its bytes verified. At this checkpoint the product site still serves version 0.7.0; this candidate is not a published 0.8.0 release. Website credentials and fresh advertised-runtime release-install acceptance remain separate release requirements.

## Candidate distribution checks

All five installation routes passed against public commit `21e8010b6a6342262e9973f6ffad0306e5b4d2b2`: Claude Code and Codex marketplaces, and Skills CLI for Claude Code, Codex and Gemini CLI. All 35 installed skill files matched the source bytes. Claude used a separate profile; Skills CLI used separate temporary project folders. The temporary Codex plugin and marketplace were removed, restoring its original marketplace list. No model session or provider call was used.

README rendering passed bounded checks at 375, 768, 1024, 1440 and 1920 pixels: no document overflow or clipped content, footer links work, and reduced motion disables entrance animation. Full design-system conformance was not assessed because the source design documents were unavailable. A decorative connector protrudes slightly at 768 pixels without affecting text.

The owner explicitly authorized a GitHub-only release while product-site publication awaits access. This changes the release scope, not the website parity evidence: the product URL still serves 0.7.0 at this checkpoint. Desktop auto-update and native wizard screen progression are not inferred from these checks.
