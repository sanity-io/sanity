---
name: sanity-visual-regression
description: Add, review, and maintain Chromatic visual regression coverage in the Sanity monorepo via dev/storybook stories, the vitest browser-mode suite, and Playwright e2e snapshots. Use when adding visual test coverage, writing stories, reviewing Chromatic diffs, working on the styled-components to vanilla-extract or @sanity/ui to ui5 migrations, or when a PR needs visual regression protection.
---

# Sanity Visual Regression Testing

Visual regression runs on [Chromatic](https://www.chromatic.com), wired via
[.github/workflows/chromatic.yml](../../../.github/workflows/chromatic.yml). Three snapshot
sources, one Chromatic project each:

| Source                          | Chromatic project | Repo secret                         | Status                                             |
| ------------------------------- | ----------------- | ----------------------------------- | -------------------------------------------------- |
| `dev/storybook` stories         | `sanity`          | `CHROMATIC_PROJECT_TOKEN_STORYBOOK` | Active                                             |
| Vitest browser tests (in place) | vitest project    | `CHROMATIC_PROJECT_TOKEN_VITEST`    | Wired; activates when the secret lands (see below) |
| Playwright e2e `takeSnapshot()` | `sanity_e2e`      | `CHROMATIC_PROJECT_TOKEN_E2E`       | Active, curated opt-in                             |

Each source owns a disjoint set of states. A `*.browser.test.tsx` is the snapshot source for
everything its `*Story.tsx` harness renders — the Vitest plugin archives every test's end state
with no test code changes — so browser-test harnesses do not get a Storybook story on top.
Stories cover the states no browser test renders.

All checks are non-gating during burn-in (`exitZeroOnChanges`); merges to `main` auto-accept
baselines. Review diffs on the Chromatic build linked from the PR check.

## Quick start: add visual coverage for a component

Before writing anything, run `pnpm visual-coverage <path> --prs` and follow
[sanity-visual-coverage](../sanity-visual-coverage/SKILL.md). It reports whether a story already
renders the component or an open PR is about to, so you only add what is missing.

1. Add a co-located `*.stories.tsx` file to the owning package's `src` tree, usually in the same
   `__tests__` directory as the component or harness. Storybook discovers story files in workspace
   package `src` trees — do not add CSF under `dev/storybook/stories/`. Two patterns:
   - **Plain component states** (ui-components wrappers, tone/card sentinels): render variants
     directly — see
     [Button.stories.tsx](../../../packages/sanity/src/ui-components/button/__tests__/Button.stories.tsx).
     Put many variants in one story (a grid) to keep snapshot count low.
   - **Studio-context states** (form inputs, anything needing workspace/i18n/layers): wrap in the
     browser-test harness `TestWrapper` (+ `TestForm` for form inputs) — see
     [Dialog.stories.tsx](../../../packages/sanity/src/ui-components/dialog/__tests__/Dialog.stories.tsx)
     and
     [EditorChrome.stories.tsx](../../../packages/sanity/src/core/form/inputs/PortableText/__tests__/EditorChrome.stories.tsx).
     New coverage can use a colocated `*Story.tsx` when the grid needs `TestWrapper` inside the
     harness — see
     [ConfirmPopover.stories.tsx](../../../packages/sanity/src/ui-components/confirmPopover/__tests__/ConfirmPopover.stories.tsx).
     Do **not** write a story whose `component` is a harness that a `*.browser.test.tsx` already
     renders: that state is snapshotted by the Vitest integration, and the story would be a
     duplicate snapshot of the same pixels. If the test's harness lacks a state you need, add it
     to the test (or to a separate story-only harness), not as a CSF re-export.
2. Overlays that only exist after interaction (tooltips, menus, submenu flyouts) get a `play`
   function using `storybook/test` (`userEvent` + `waitFor`/`expect(...).toBeVisible()`, querying
   `within(document.body)` for portaled content). Chromatic and addon-vitest both run `play`
   before capturing, so the snapshot shows the open overlay — see
   [Tooltip.stories.tsx](../../../packages/sanity/src/ui-components/tooltip/__tests__/Tooltip.stories.tsx)
   and
   [MenuGroup.stories.tsx](../../../packages/sanity/src/ui-components/menuGroup/__tests__/MenuGroup.stories.tsx)
   (the latter also documents an animation pitfall with nested popovers). Statically controllable
   overlays (e.g. Popover's `open` prop) don't need `play`.
3. Verify locally: `pnpm dev:storybook` (port 6006), then `pnpm --filter sanity-storybook test`
   (every story runs as a vitest browser-mode test via `@storybook/addon-vitest`).
4. Push — the `Chromatic / Storybook visual tests` check snapshots only affected stories
   (TurboSnap) and links the build for review.

Migration priority: card and tone-related components first (tones cascade through everything),
box primitives later. Snapshot the _wrapper_ components in `packages/sanity/src/ui-components`
and vanilla-extract-migrated components (change indicators, `DocumentLayout`) as sentinels.

## Documented stories vs regression fixtures (tags)

The Storybook is a living document of how reusable components look and behave, so the sidebar is
curated: only stories written to be read by humans appear in it. Stories that exist purely as
snapshot targets are tagged out of navigation but keep their test coverage:

- **Documented stories** (default tags): authored variant grids and component states with a
  concise JSDoc description. Held to a docs-quality bar — someone browsing the deployed Storybook
  should learn how the component is used.
- **Regression fixtures** (`tags: ['!dev', '!autodocs', 'vrt-only']`): state dumps with no
  explanatory value (a chrome grid, an error card matrix). `!dev` removes the story from the
  sidebar and `!autodocs` from any future docs pages, but the story stays in the index —
  Chromatic still snapshots it and addon-vitest still renders it (the `test` tag is kept). The
  `vrt-only` custom tag makes them greppable and filterable.

The inverse also exists: a story that should be browsable but never snapshotted keeps default
tags and sets `parameters: {chromatic: {disableSnapshot: true}}`.

## Determinism rules for stories

- Harness stories are deterministic by construction (mock client/workspace, no network).
- Never render live timestamps, random ids, or unfinished loading states. Chromatic pauses CSS
  animations automatically.
- Knobs via `parameters.chromatic` per story/meta: `delay` (ms before capture — Portable Text
  stories use 300 for editor boot), `diffThreshold`, `disableSnapshot: true` (story stays in
  Storybook + addon-vitest but is never snapshotted), `modes` (viewport/theme matrix — the global
  1280×900 desktop mode in [preview.tsx](../../../dev/storybook/.storybook/preview.tsx) matches
  the vitest browser viewport).

## Vitest integration activation runbook

[Chromatic for Vitest Browser Mode](https://www.chromatic.com/blog/introducing-chromatic-for-vitest-browser-mode/)
is generally available (`@chromatic-com/vitest` 1.x). The plugin is wired into
`packages/sanity/vitest.browser.config.mts` and the `Chromatic / Vitest browser visual tests`
job, but the job stays dormant until the project token exists. To activate:

1. Create a Vitest-type project in Chromatic (project type "Vitest").
2. Add its token as the `CHROMATIC_PROJECT_TOKEN_VITEST` repo secret.
3. Done — the job self-activates on the next run. No code changes. Every browser test's end
   state becomes a snapshot; the first build is the full baseline.

Stories that merely re-exported browser-test harnesses were removed when the plugin went GA; the
browser tests are the snapshot source for those states. See [REFERENCE.md](REFERENCE.md) for
local capture runs, `takeSnapshot()`/`configure()` usage inside tests (only valid once the plugin
is active — `takeSnapshot()` THROWS in normal runs, so never commit calls to it while the
integration is dormant), and cost controls.

## Playwright e2e snapshots

`e2e/studio-test.ts` wraps `@chromatic-com/playwright` with auto-snapshots disabled globally —
the suite runs against per-PR staging datasets (live timestamps, presence, parallel mutations),
so blanket end-of-test snapshots would be pure diff noise. Opt in per spec with `takeSnapshot()`
at deterministic moments only. See [REFERENCE.md](REFERENCE.md#playwright-e2e-snapshots) before
adding e2e snapshots.

## More

[REFERENCE.md](REFERENCE.md): architecture and rationale, local Chromatic runs, CLI flags,
snapshot cost management, Vercel deployment (`studio-storybook.sanity.dev`), troubleshooting.
