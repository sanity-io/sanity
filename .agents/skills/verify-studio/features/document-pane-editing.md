# Document pane editing

Create a document in the structure tool, edit a field and see it saved as a draft.

## Setup

- Target `e2e` (empty dataset; the `book` type has a `title` string field). On `test`, the same
  steps work with `/test/structure/author;<id>` and `[data-testid="field-name"]`.
- Pick an id: `ID=verify-$(openssl rand -hex 3)`. Opening a path with an unused id opens a new,
  unsaved document of that type.
- `login.sh e2e /chromium/content`

## Steps

```bash
S=.agents/skills/verify-studio/scripts; OUT=/opt/cursor/artifacts/verify-studio
TITLE='[data-testid="field-title"] [data-testid="string-input"]'
```

1. Open the new document: `$S/pw.sh goto "http://localhost:3339/chromium/content/book;$ID"`, then
   `$S/wait-for.sh "$TITLE"`.
2. Edit the title: `$S/pw.sh fill "$TITLE" "Verify studio walkthrough"`.
3. Wait for the save: poll
   `$S/pw.sh --raw eval "document.querySelector('[data-testid=pane-footer-document-status]')?.innerText"`
   until it reads `Saved` (or `Edited …`).
4. Optional, for layout changes: maximise the pane with
   `$S/pw.sh click '[data-testid="focus-pane-button-focus"]'`.

## Expected

1. The form renders (`[data-testid="form-view"]` without `data-read-only="true"`), and the page
   shows no "tool crashed" error.
2. The document title (`[data-testid="document-panel-document-title"]`) follows the field.
3. The footer reports the save, and the API returns `drafts.$ID` with the title:
   `GET https://ittbm412.api.sanity.work/v2024-01-01/data/query/$DATASET?query=*[_id=="drafts.$ID"]{title}&perspective=raw`
   (token in the header through `curl -H @-`, as `lib.sh`'s `users_me_status` does).

## Evidence

- `01-draft-edited.png` after step 3, pointer moved off the field (`$S/pw.sh mousemove 5 890`).
- The footer text and the API response in the report.
- No teardown needed on `e2e` (the dataset goes with `cleanup.sh`). On `test`, delete the draft
  (Discard changes in `[data-testid="pane-context-menu-button"]`, or a `delete` mutation).
