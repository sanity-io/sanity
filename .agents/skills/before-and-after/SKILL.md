---
name: before-and-after
description: Add existing screenshots or screen recordings to a GitHub pull request as a before/after or preview block. Use when a PR needs visual media attached to its description. Browser navigation and capture belong to agent-browser.
---

# Add visual media to a PR

Use `agent-browser` to create the screenshots or recordings. This skill only owns the GitHub PR attachment workflow.

## Capture

1. Load the version-matched core instructions with `agent-browser skills get core --full` and follow them for sessions, navigation, page state, screenshots, and recordings.
2. If a Vercel URL is protected, load `agent-browser skills get protected-vercel-deployments --full`. Do not reproduce its authentication workflow here.
3. Save media under the repository with paths that contain no whitespace, for example:

   ```text
   captures/desktop-before.png
   captures/desktop-after.png
   captures/mobile-before.png
   captures/mobile-after.png
   ```

The formatter supports PNG, JPEG, GIF, WebP, MP4, MOV, and WebM files. Use an `--after` file without a matching `--before` file for a net-new preview.

### Screen recordings

`agent-browser record start` creates a fresh browser context. It preserves cookies and local storage, but an origin-scoped header used to open a protected Vercel Preview may not carry into that new context. Before recording a protected Preview:

1. Load `agent-browser skills get protected-vercel-deployments --full`.
2. Start the recording context on a blank page.
3. Apply the authentication method from that skill inside the recording context.
4. Navigate to the Preview only after authentication is active, then trim the navigation lead-in if necessary.

Do not assume that a page which worked before `record start` will remain authenticated after it.

Agent-browser `0.35.2` and `0.36.0` capture at a hardcoded 10 fps with no CLI or environment override. Inspect the installed version and its recording reference rather than assuming this stays true in later releases. Preserve the source cadence when transcoding: changing the container to 30 or 60 fps only duplicates frames and does not make motion smoother. For animation evidence that requires a higher real frame rate, use a genuinely higher-cadence capture path instead of upsampling agent-browser output.

### Equal-height image pairs

GitHub vertically centers a shorter image inside a Markdown table cell. For full-page before/after screenshots, make both files the same pixel height so their top edges align:

1. Open both pages at the same viewport and state.
2. Read `document.documentElement.scrollHeight` in both sessions.
3. Append bottom-only space to the shorter page until both scroll heights match, then take both `--full` screenshots.

The padding may be transparent or use the capture tool's default canvas. Never add space above the page. For component or section comparisons, capture the same scoped region instead of padding unrelated page content.

Use raw `agent-browser eval` for this DOM-only adjustment; do not add an image-processing dependency to this skill. Confirm the resulting files have equal pixel dimensions before publishing.

## Format

Pass one `--before` and `--after` pair for each comparison. Repeat `--label` to identify multiple pairs:

```bash
node skill/scripts/format.mjs \
  --before captures/desktop-before.png \
  --after captures/desktop-after.png \
  --before captures/mobile-before.png \
  --after captures/mobile-after.png \
  --label Desktop \
  --label Mobile \
  > /tmp/before-and-after.md
```

For an after-only preview:

```bash
node skill/scripts/format.mjs \
  --after captures/new-page.png \
  > /tmp/before-and-after.md
```

Add `--attribution "<name>"` to prefix the block with a `> Before/after by <name>` line when the PR should credit who produced the evidence.

Images render in tables. Local videos initially render on their own lines so `gh --attach` can upload them and expose their final attachment URLs. Before/after video tables use the two-step workflow below because `gh --attach` does not rewrite local references inside `<video src>` attributes.

## Place the evidence

Read the existing PR description before inserting a new marked block. Put visual evidence near the top, after the short opening context and an existing Preview or deployment-link section when present, but before implementation-heavy sections such as Details, Changes, Testing, or Notes.

Use this reading order inside the visual evidence:

1. Put the real before/after or Preview evidence that proves the PR first.
2. Put supplemental formats, alternate states, or demonstrations after the primary evidence.
3. Label anything that demonstrates this skill rather than the PR itself as a demo, and state material limitations beside it. For example, note the installed agent-browser recorder's current 10 fps limit when motion smoothness matters.

Headings are semantic hints, not required names. Never invent or rewrite prose merely to create an anchor, and never split a paragraph, list, table, code block, or other Markdown structure. If no safe anchor is clear, append the block rather than risking damage. If a marked block already exists, move or replace that whole block only; preserve every byte of unrelated prose.

After publishing, open the rendered PR and confirm the primary evidence appears before supplemental demos and before the implementation details.

## Publish

Preserve the existing PR description and replace only this skill's marked block:

```bash
PR=123
gh pr view "$PR" --json body --jq .body > /tmp/pr-body.md

node skill/scripts/format.mjs \
  --body-file /tmp/pr-body.md \
  --before captures/desktop-before.png \
  --after captures/desktop-after.png \
  > /tmp/pr-body-next.md

ATTACH_ARGS=()
while IFS= read -r file; do
  ATTACH_ARGS+=(--attach "$file")
done < <(
  node skill/scripts/format.mjs \
    --attach-list \
    --before captures/desktop-before.png \
    --after captures/desktop-after.png
)

gh pr edit "$PR" --body-file /tmp/pr-body-next.md "${ATTACH_ARGS[@]}"
```

Run the formatter and `gh` from the same directory. `gh --attach` uploads the local files to GitHub and rewrites their matching local references in the PR body.

After publishing, fetch or open the PR description and confirm that no `./captures/...` references remain inside the marked block and that the evidence appears in the intended reading order.

### Publish a video table

Video comparisons are a first-class two-step publish operation:

1. Upload the local videos in a temporary PR comment using the normal own-line output and `gh pr comment --attach`.
2. Fetch that comment through `gh api` and collect the stable `https://github.com/user-attachments/assets/...` URLs in before/after order.
3. Generate the final HTML table from those URLs and replace the marked PR block:

   ```bash
   node skill/scripts/format.mjs \
     --body-file /tmp/pr-body.md \
     --before-video-url https://github.com/user-attachments/assets/BEFORE_ID \
     --after-video-url https://github.com/user-attachments/assets/AFTER_ID \
     --label "Desktop hero" \
     > /tmp/pr-body-next.md

   gh pr edit "$PR" --body-file /tmp/pr-body-next.md
   ```

4. Fetch the edited PR body before deleting the temporary comment. Confirm both final URLs are present and no local video paths remain, then delete the comment.
5. Open the rendered PR and confirm both `<video>` elements are inside the comparison table, reach a playable ready state, and show controls.

If URL extraction, formatting, or PR verification fails, keep the temporary comment so its uploaded attachments remain recoverable and retry from the last successful phase. Use own-line videos as the simple fallback.

Do not publish captures containing Vercel OIDC tokens, bypass secrets, authenticated query parameters, or browser state files.

## Script contract

`scripts/format.mjs` is intentionally the only bundled script. It:

- formats existing local media;
- formats final GitHub video attachment URLs as HTML comparison tables;
- labels after-only media as `Preview`;
- emits the exact attachment path list;
- inserts or replaces `<!-- before-and-after:start/end -->` without changing other PR prose.

Its arguments version with this skill and are not a public library API.
