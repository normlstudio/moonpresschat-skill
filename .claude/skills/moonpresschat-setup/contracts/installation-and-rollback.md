# Installation, environment, and rollback

This is the cold-start safety contract. Installation and activation are
human-operated on both paths; the API path adds an automated rollback for
applied configuration (see "Automated rollback" below).

## Verified distribution only

An acceptable MoonPress Chat package comes from one of these surfaces:

1. The WordPress **Plugins → Add New** directory result whose slug, publisher,
   and details identify the official MoonPress Chat release.
2. A download surface on the official MoonPress Chat product domain.
3. A release ZIP supplied directly through the owner's existing MoonPress Chat/Norml
   delivery channel.

The agent must verify the hostname and product identity from public information
available at the time. Never substitute a third-party mirror, search-result
attachment, unofficial fork, or guessed GitHub URL. As of this skill release,
WordPress.org availability is not assumed.

If the owner has no verified package, stop with:

```yaml
installation: blocked-official-package
```

This is a complete and safe outcome; a missing distribution is not permission
to improvise.

## Human installation sequence

1. Human confirms a backup/reset checkpoint appropriate to the environment.
2. Human opens **Plugins → Add New**.
3. Human either installs the verified directory listing or uses **Upload
   Plugin** with the verified ZIP.
4. Human activates **MoonPress Chat**.
5. Human reports the installed version and whether **MoonPress Chat → Setup** opens.
6. Human confirms public visibility is off.

The guided screen-by-screen guidance is verified against MoonPress Chat 3.11.0; the
API path's contract is verified against MoonPress Chat 5.0.0 (contract unchanged
through 5.3.1) and requires 5.0.0 or newer (MoonPress Chat 5.0.0 renamed the plugin and every internal
identifier; 4.8.0 and older, released as QuipBot, register only the old
`quipbot/v1` namespace and use the guided path). WordPress 6.2+ and PHP 7.4+
are the runtime floors. Treat these as
compatibility floors, not a claim that every unrelated plugin/theme
combination is compatible.

If MoonPress Chat is already installed but inactive, begin at activation step 4 after
confirming that the installed copy came from the owner's trusted installation.

## Environment decision

- Prefer staging when it represents production closely enough to test the
  provider, knowledge, consent, handoff, and widget.
- Production-direct setup is allowed only after explicit environment choice,
  a restorable backup, and approval of the non-secret plan.
- Never copy a production provider key into setup artifacts. The human enters a
  key separately in each environment.

## Baseline before change

Record the existing non-secret state in `configuration-plan.md`: installed
version, visibility, active provider/model, whether a key exists, enabled site
language, and which configuration areas are already populated. Do not ask for
raw keys, conversation data, or authenticated screenshots.

## Automated rollback (API path)

When the last configuration write was `POST /setup/apply`, the matching
automated rollback is:

```bash
node helper/moonpresschat-setup-helper.mjs call https://example.com POST /setup/rollback --body rollback.json
```

with `rollback.json` containing `{"rollback_id": "<the id the apply response
returned>"}`. It restores exactly the MoonPress Chat options the apply snapshotted
and consumes the snapshot on success; `moonpresschat_setup_no_snapshot` means there
is nothing left to restore.

**The provider secret is never restored by rollback.** The snapshot never
contains it in the first place — rollback restores the provider *selection*
(provider and model) only, and after a rollback that changed the selection the
provider test must be re-run. Rollback also never restores WordPress users,
plugins, posts, arbitrary options, or external provider state.

Visibility first, always: if the widget is public, turn it off before rolling
back — rollback does not change visibility.

## Rollback and immediate disable

Use this order after any failed public behavior, privacy concern, or unexpected
output:

1. Human turns **Settings → Visibility → Make the bot live for visitors** off
   and saves.
2. Confirm the widget is absent for an anonymous visitor.
3. Restore the recorded pre-change non-secret values — on the API path via
   `POST /setup/rollback` (above), on the guided path by hand — or restore the
   confirmed backup/reset checkpoint.
4. If MoonPress Chat admin cannot be used, the human deactivates MoonPress Chat from Installed
   Plugins, then confirms the widget is absent.
5. Record the failed check and rollback evidence. Do not retry go-live without
   a new verification pass and new approval.

Never delete conversations, leads, or plugin data as an improvised rollback.
