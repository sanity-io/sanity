# Publishing

Publish a draft and check the published state, then optionally unpublish it.

## Setup

- Target `e2e`. Run `document-pane-editing.md` first so a draft `drafts.$ID` exists, with the
  document open.
- Documents created through raw API mutations have no publish event, so history and Review
  changes stay empty for them. Publish through the UI when the change touches history.

## Steps

```bash
S=.agents/skills/verify-studio/scripts; OUT=/opt/cursor/artifacts/verify-studio
STATUS="document.querySelector('[data-testid=pane-footer-document-status]')?.innerText"
```

1. `$S/wait-for.sh '[data-testid="action-publish"]'`, then
   `$S/pw.sh click '[data-testid="action-publish"]'`.
2. Poll `$S/pw.sh --raw eval "$STATUS"` until it matches `/published/i` (allow about 30 seconds;
   staging can be slow).
3. Optional, unpublish (the flow of `e2e/tests/document-actions/unpublish.spec.ts`): the action
   is only offered on the published variant. Open the inventory with
   `[data-testid="action-document-group-inventory"]`, click
   `[data-variant-set="Published"] button:has-text("All users (Default)")`, close the inventory
   with the same button, then click `[data-testid="action-unpublish"]` and confirm with
   `[data-testid="confirm-button"]`.

## Expected

1. The publish button turns disabled once the publish lands.
2. The footer reads `Last published just now`, and the API returns the published `$ID` (without
   the `drafts.` prefix) with the edited title and no `drafts.$ID`.
3. After unpublishing, the API returns `drafts.$ID` and no `$ID`, and the footer no longer says
   published.

## Evidence

- `02-published.png` after step 2; `03-unpublished.png` after step 3 when it ran.
- The footer text and the API response for each state in the report.
