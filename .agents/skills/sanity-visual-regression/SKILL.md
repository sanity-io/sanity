---
name: sanity-visual-regression
description: Add, review, and maintain Chromatic visual regression coverage in the Sanity monorepo via dev/storybook stories, the vitest browser-mode suite, and Playwright e2e snapshots. Use when adding visual test coverage, writing stories, reviewing Chromatic diffs, working on the styled-components to vanilla-extract or @sanity/ui to ui5 migrations, or when a PR needs visual regression protection.
---

# Sanity Visual Regression Testing

Visual regression runs on [Chromatic](https://www.chromatic.com), wired via
[.github/workflows/chromatic.yml](../../../.github/workflows/chromatic.yml). Three snapshot
sources, one Chromatic project each:

| Source                          | Chromatic project          | Repo secret                         | Status                 |
| ------------------------------- | -------------------------- | ----------------------------------- | ---------------------- |
| `dev/storybook` stories         | "sanity studio"            | `CHROMATIC_PROJECT_TOKEN_STORYBOOK` | Active                 |
| Vitest browser tests (in place) | "sanity studio vitest"     | `CHROMATIC_PROJECT_TOKEN_VITEST`    | Active                 |
| Playwright e2e `takeSnapshot()` | "sanity studio playwright" | `CHROMATIC_PROJECT_TOKEN_E2E`       | Active, curated opt-in |

All checks are non-gating during burn-in (`exitZeroOnChanges`); merges to `main` auto-accept
baselines. Review diffs on the Chromatic build linked from the PR check.

## Which source owns a state

Each source owns a disjoint set of states. Decide by how the state is reached, and never move a
state between sources:

| The state is…                                                                                         | It belongs in                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Reachable from props/fixtures alone, or one `play` interaction (open a menu, hover a tooltip)         | A `*.stories.tsx` in the owning package (`dev/storybook` snapshots it)                                          |
| Reached by driving the UI: typing, drag, clipboard, focus tracking, viewport changes, server commands | A `*.browser.test.tsx` — its end state is the snapshot; `takeSnapshot()` for mid-test states (see below)        |
| Full-studio chrome against a real deployment and dataset                                              | A Playwright spec using `e2e/studio-visual-test.ts` ("sanity studio playwright" project), read-only states only |

Consequences:

- A `*.browser.test.tsx` is the snapshot source for everything it renders — the Vitest plugin
  archives every test's end state with no test code changes. Browser tests keep their harness
  component inline (`function FooHarness()` in the test file) and never get a Storybook story on
  top. Do not re-export a browser test as a story, and do not port a browser test into a story
  with an elaborate `play` function.
- Every `*Story.tsx` file is a Storybook harness imported by a `*.stories.tsx`. Stories cover the
  states no browser test renders.
- Playwright stays in `e2e/`. Do not put specs, `@chromatic-com/playwright`, or e2e fixtures under
  `dev/storybook`, and do not turn an e2e spec into a story (or the reverse) to get a snapshot.
  `dev/storybook`'s `playwright` dependency is only the browser runner for `@storybook/addon-vitest`.
- Do not add a `Chromatic / …` job that uploads one source's output to another source's project;
  Chromatic requires one project per integration type.

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
     shared mock-studio wrapper `TestWrapper` (+ `TestForm` for form inputs) from
     `packages/sanity/test/browser` — the same wrapper the browser tests use — see
     [Dialog.stories.tsx](../../../packages/sanity/src/ui-components/dialog/__tests__/Dialog.stories.tsx)
     and
     [EditorChrome.stories.tsx](../../../packages/sanity/src/core/form/inputs/PortableText/__tests__/EditorChrome.stories.tsx).
     New coverage can use a colocated `*Story.tsx` when the grid needs `TestWrapper` inside the
     harness — see
     [ConfirmPopover.stories.tsx](../../../packages/sanity/src/ui-components/confirmPopover/__tests__/ConfirmPopover.stories.tsx).
     Do **not** extract a browser test's inline harness into a `*Story.tsx` to reuse it from a
     story: that state is snapshotted by the Vitest integration, and the story would be a
     duplicate snapshot of the same pixels. If the test's harness lacks a state you need, add it
     to the test, or build a separate story-only harness.
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

## Every story is browsable

The Storybook is a living document of how reusable components look and behave, and every story
in it is meant to be read: authored variant grids, component states and migration sentinels,
each with a concise JSDoc description of what it shows and why. Do not use story `tags` to hide
stories from the sidebar (`!dev`) or docs (`!autodocs`). That convention existed only for the
stories that re-exported vitest browser tests, and those are gone — browser tests are snapshotted
in place by the Vitest project. If a state is not worth a person looking at, it does not belong
in Storybook; drive it in a browser test instead (see "Which source owns a state").

A story that should be browsable but never snapshotted sets
`parameters: {chromatic: {disableSnapshot: true}}`.

## Determinism rules for stories

- Harness stories are deterministic by construction (mock client/workspace, no network).
- Never render live timestamps, random ids, or unfinished loading states. Chromatic pauses CSS
  animations automatically.
- Knobs via `parameters.chromatic` per story/meta: `delay` (ms before capture — Portable Text
  stories use 300 for editor boot), `diffThreshold`, `disableSnapshot: true` (story stays in
  Storybook + addon-vitest but is never snapshotted), `modes` (viewport/theme matrix — the global
  1280×900 desktop mode in [preview.tsx](../../../dev/storybook/.storybook/preview.tsx) matches
  the vitest browser viewport).

## Browser tests: automatic snapshots, opt-outs, targeted snapshots

[Chromatic for Vitest Browser Mode](https://www.chromatic.com/blog/introducing-chromatic-for-vitest-browser-mode/)
is generally available (`@chromatic-com/vitest` 1.x) and the "sanity studio vitest" project is
live: the `Chromatic / Vitest browser visual tests` job re-runs the suite on chromium with
`CHROMATIC=1` on every PR and pushes the archives. Every `*.browser.test.tsx` is in the visual
suite without any code in the test, and the `MyComponent.browser.test.tsx` +
`MyComponentStory.tsx` + `MyComponent.stories.tsx` triple that existed only to snapshot a browser
test is gone (see "Which source owns a state").

- **Automatic snapshot at the end of every test.** Name it well: in Chromatic the snapshot is
  `describe chain / it title / Snapshot #n` under the test file's path.
- **Opt out with `configure({disableAutoSnapshot: true})`** from `@chromatic-com/vitest`. The
  scope follows where it is called: at the top level of a test file it applies to every test in
  the file; inside a `describe()` to that suite and its nested suites; inside a `test()` to that
  test only. Use it for tests whose end state is not worth a snapshot (pure interaction checks,
  cleanup-only states) — the snapshot budget is per test case.
- **Targeted snapshots with `await takeSnapshot('state name')`** inside a `test()`, for states
  the test moves through but does not end on (a menu open before the click that closes it, a
  drag mid-way). Always `await` it; the plugin fails the test on un-awaited calls. Docs:
  [targeted snapshots](https://www.chromatic.com/docs/vitest/targeted-snapshots/).
- **Safe in every run.** The plugin is registered in `vitest.browser.config.mts` on every run, so
  both helpers work in plain `pnpm --filter sanity test:browser` runs and in the functional
  `browser-tests.yml` shards; they are no-ops on firefox and webkit. Only `CHROMATIC=1` turns on
  capturing (automatic snapshots, TurboSnap stats, reporter output, Chromatic telemetry); a
  normal run writes nothing except the archive of an explicit `takeSnapshot()` call, into the
  gitignored `.vitest/chromatic`.

See [REFERENCE.md](REFERENCE.md) for local capture runs, TurboSnap, sharding and cost controls.

## Playwright e2e snapshots

`e2e/studio-test.ts` wraps `@chromatic-com/playwright` with auto-snapshots disabled globally —
the suite runs against per-PR staging datasets (live timestamps, presence, parallel mutations),
so blanket end-of-test snapshots would be pure diff noise. Opt in per spec with `takeSnapshot()`
at deterministic moments only. See [REFERENCE.md](REFERENCE.md#playwright-e2e-snapshots) before
adding e2e snapshots.

## More

[REFERENCE.md](REFERENCE.md): architecture and rationale, local Chromatic runs, CLI flags,
snapshot cost management, Vercel deployment (`studio-storybook.sanity.dev`), troubleshooting.
