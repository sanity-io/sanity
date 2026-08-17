---
name: sanity-visual-regression
description: Add, review, and maintain Chromatic visual regression coverage in the Sanity monorepo via dev/storybook stories, the vitest browser-mode suite, and Playwright e2e snapshots. Use when adding visual test coverage, writing stories, reviewing Chromatic diffs, working on the styled-components to vanilla-extract or @sanity/ui to ui5 migrations, or when a PR needs visual regression protection.
---

# Sanity Visual Regression Testing

Visual regression runs on [Chromatic](https://www.chromatic.com), wired via
[.github/workflows/chromatic.yml](../../../.github/workflows/chromatic.yml). Three snapshot
sources, one Chromatic project each:

| Source                          | Chromatic project | Repo secret                         | Status                                        |
| ------------------------------- | ----------------- | ----------------------------------- | --------------------------------------------- |
| `dev/storybook` stories         | `sanity`          | `CHROMATIC_PROJECT_TOKEN_STORYBOOK` | Active                                        |
| Vitest browser tests (in place) | vitest project    | `CHROMATIC_PROJECT_TOKEN_VITEST`    | Dormant (early access) — see activation below |
| Playwright e2e `takeSnapshot()` | `sanity_e2e`      | `CHROMATIC_PROJECT_TOKEN_E2E`       | Active, curated opt-in                        |

All checks are non-gating during burn-in (`exitZeroOnChanges`); merges to `main` auto-accept
baselines. Review diffs on the Chromatic build linked from the PR check.

## Quick start: add visual coverage for a component

1. Prefer a story in `dev/storybook/stories/`. Put render logic in a `*Story.tsx` harness inside
   `packages/sanity` (see below) and keep the CSF file thin. Two patterns:
   - **Plain component states** (ui-components wrappers, tone/card sentinels): render variants
     in one harness (a grid) to keep snapshot count low — see
     [TabStory.tsx](../../../packages/sanity/src/ui-components/tab/__tests__/TabStory.tsx).
   - **Studio-context states** (form inputs, anything needing workspace/i18n/layers): wrap
     `TestWrapper` (+ `TestForm` for form inputs) **inside the harness** — see
     [ConfirmPopoverStory.tsx](../../../packages/sanity/src/ui-components/confirmPopover/__tests__/ConfirmPopoverStory.tsx)
     and the Portable Text stories. If a vitest browser test already has a `*Story.tsx` harness,
     reuse it (never fork it): the harness stays shared between the test and the story.
2. Verify locally: `pnpm dev:storybook` (port 6006), then `pnpm --filter sanity-storybook test`
   (every story runs as a vitest browser-mode test via `@storybook/addon-vitest`).
3. Push — the `Chromatic / Storybook visual tests` check snapshots only affected stories
   (TurboSnap) and links the build for review.

Migration priority: card and tone-related components first (tones cascade through everything),
box primitives later. Snapshot the _wrapper_ components in `packages/sanity/src/ui-components`
and vanilla-extract-migrated components (change indicators, `DocumentLayout`) as sentinels.

## Avoiding cross-package boundary imports

Storybook stories in `dev/storybook/stories/` should **not** import directly from component source
files in `packages/sanity/src/`. Instead, create a `*Story.tsx` harness inside the package:

1. **Create the harness** in a `__tests__/` directory near the component:
   ```
   packages/sanity/src/core/comments/components/__tests__/CommentBreadcrumbsStory.tsx
   ```
2. **Use relative imports** within the package (e.g., `../CommentBreadcrumbs`).
3. **Wrap with `TestWrapper`** if the component needs studio context (i18n, workspace, layers).
4. **Import the harness** from the Storybook story:
   ```ts
   // dev/storybook/stories/comments/CommentBreadcrumbs.stories.tsx
   import {CommentBreadcrumbsStory} from '../../../../packages/sanity/src/core/comments/components/__tests__/CommentBreadcrumbsStory'
   ```

This pattern keeps story logic inside the `sanity` package and matches existing stories like
`CommentInputStory`, `TableStory`, and all Portable Text stories. The harness can also be reused
by vitest browser tests. Do not import production components from `dev/storybook` via relative
paths into `packages/sanity/src/` — that is a cross-package boundary.

A few older ui-components sentinels (`Button`, `Dialog`, `ToneIcon`) still import wrappers
directly; leave those unless you are already touching the file. New coverage should use a
harness.

## Determinism rules for stories

- Harness stories are deterministic by construction (mock client/workspace, no network).
- Never render live timestamps, random ids, or unfinished loading states. Chromatic pauses CSS
  animations automatically.
- Knobs via `parameters.chromatic` per story/meta: `delay` (ms before capture — Portable Text
  stories use 300 for editor boot), `diffThreshold`, `disableSnapshot: true` (story stays in
  Storybook + addon-vitest but is never snapshotted), `modes` (viewport/theme matrix — the global
  1280×900 desktop mode in [preview.tsx](../../../dev/storybook/.storybook/preview.tsx) matches
  the vitest browser viewport).

## Vitest integration activation runbook (when early access lands)

`@chromatic-com/vitest` is pre-wired but dormant. To activate:

1. Create the Vitest-type Chromatic project (requires Chromatic early access enablement).
2. Add its token as the `CHROMATIC_PROJECT_TOKEN_VITEST` repo secret.
3. Done — the `Chromatic / Vitest browser visual tests` job self-activates on the next run. No
   code changes. Every browser test's end state becomes a snapshot; the first build is the full
   baseline.

Afterwards, consider slimming the harness-reuse stories in `dev/storybook/stories` that overlap
with end-of-test snapshots (keep them if the browsable workbench view is worth the snapshot
spend). See [REFERENCE.md](REFERENCE.md) for local capture runs, `takeSnapshot()`/`configure()`
usage inside tests (only valid once the plugin is active — `takeSnapshot()` THROWS in normal
runs, so never commit calls to it while the integration is dormant), and cost controls.

## Playwright e2e snapshots

`e2e/studio-test.ts` wraps `@chromatic-com/playwright` with auto-snapshots disabled globally —
the suite runs against per-PR staging datasets (live timestamps, presence, parallel mutations),
so blanket end-of-test snapshots would be pure diff noise. Opt in per spec with `takeSnapshot()`
at deterministic moments only. See [REFERENCE.md](REFERENCE.md#playwright-e2e-snapshots) before
adding e2e snapshots.

## More

[REFERENCE.md](REFERENCE.md): architecture and rationale, local Chromatic runs, CLI flags,
snapshot cost management, Vercel deployment (`studio-storybook.sanity.dev`), troubleshooting.
