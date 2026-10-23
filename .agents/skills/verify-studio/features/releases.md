# Releases

Create a release in the Releases tool, then archive and delete it.

## Setup

- Target `e2e`: releases are per dataset, and the run's dataset starts with none. On `test` the
  dataset is shared, so everything seeded here must be archived and deleted by the last steps.
- `login.sh e2e /chromium/releases`
- To put a document in the release, create it through the actions API instead
  (`sanity.action.release.create`, `sanity.action.document.version.create`; see the seeding notes
  in `AGENTS.md`), then open the release detail page.

## Steps

```bash
S=.agents/skills/verify-studio/scripts; OUT=/opt/cursor/artifacts/verify-studio
```

1. `$S/wait-for.sh button 'New release'`, then `$S/pw.sh click 'button:has-text("New release")'`
   (the overview's button has no test id).
2. `$S/wait-for.sh '[data-testid="release-form-title"]'`, then
   `$S/pw.sh fill '[data-testid="release-form-title"]' "verify-studio release"`, and
   `$S/pw.sh click '[data-testid="submit-release-button"]'`.
3. `$S/wait-for.sh '[data-testid="release-menu-button"]'` (creation can take 30 seconds on
   staging), then record `location.pathname`.
4. Archive: click `[data-testid="release-menu-button"]`, then
   `[data-testid="archive-release-menu-item"]`, then `[data-testid="confirm-button"]`, and
   `$S/wait-for.sh body 'This release is archived'`.
5. Delete: click `[data-testid="release-menu-button"]`, then
   `[data-testid="delete-release-menu-item"]`, then `[data-testid="confirm-button"]`.

Wait for each menu item and confirm button with `wait-for.sh` before clicking it.

## Expected

1. The create dialog opens (`[data-testid="release-form-title"]` is visible).
2. The dialog closes.
3. The URL is `/chromium/releases/<releaseId>` and the detail page shows the title.
4. The detail page says "This release is archived".
5. The tool returns to `/chromium/releases`, and
   `count(*[_type=="system.release"])` over the dataset (`perspective=raw`,
   `v2025-02-19`) is back to its value before step 1.

## Evidence

- `03-release-dialog.png` after step 2's fill, `04-release-detail.png` after step 3,
  `05-release-archived.png` after step 4.
- The release id and the release count before and after in the report.
