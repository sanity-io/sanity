# Walkthrough recipes

One file per Studio area. A recipe is a starting point: adapt the steps to the change under
test, keep the format, and add a recipe here when an area keeps coming up.

## Format

Every recipe has the same four sections, in this order:

1. **Setup** — the target (`test` or `e2e`), the path to sign in to, and the data the walkthrough
   needs, created by the walkthrough itself (an e2e dataset starts empty). Name anything seeded
   with a `verify-` prefix so it is recognizable in a shared dataset.
2. **Steps** — numbered actions as `pw.sh` / `wait-for.sh` commands against real handles
   (`data-testid` first, then a role or text the user sees). One observable result per step.
3. **Expected** — what each step must show, keyed by step number, checked by reading state
   (`pw.sh --raw eval`) or the API, not only by looking at a screenshot.
4. **Evidence** — the screenshots to save (numbered, `NN-what.png`) and the state to record in
   the report. Include the teardown of anything the steps created in a shared dataset.

Selectors that read UI text depend on the en-US locale; prefer the `data-testid` handles listed
in each recipe and confirm a handle still exists (`rg 'data-testid="…"' packages/sanity/src`)
before relying on it.

## Reporting a run

Report each step with one status:

- `verified` — the step ran and its Expected result was observed (say how: eval output, API
  response, screenshot).
- `failed` — the step ran and the result differed. Include what was observed and the relevant
  lines from `/tmp/verify-studio/<target>.log`.
- `skipped` — the step did not run (blocked, not applicable, out of time). Say why.

A skipped step is never reported as verified, and neither is a step that was only looked at in
a screenshot when its Expected result names state that can be read. The summary lists the
skipped steps and anything the recipes did not cover, so the reader knows what still rests on
CI or review. Example:

```text
Target: e2e (dataset cursor_ci_1a2b3c, deleted)
Recipe: publishing.md
1 verified  draft created, footer "Saved"                    01-draft.png
2 verified  publish: footer "Last published just now", API returns verify-1a2b3c with the title
3 skipped   unpublish: the change does not touch it
Not covered: scheduled publishing
```
