---
name: sanity-visual-coverage
description: Check whether Studio UI is covered by Chromatic visual regression, for a PR's changed files or for the whole tree, and decide between "already covered", "a story is pending in an open PR", and "needs a story". Use when reviewing a PR that touches packages/**/src/**/*.tsx or *.css.ts, when asked "is this covered by Chromatic", when planning ui5 or vanilla-extract migration work, or before opening a PR that adds stories.
---

# Visual regression coverage

The question this skill answers is "if this file's rendering changes, does a Chromatic snapshot
catch it?". The answer is a static fact about the repo, so a script computes it. Do not answer it
by reading the Chromatic check, and do not answer it from memory.

## Run the check

```bash
pnpm visual-coverage --changed                # files changed vs origin/main, including uncommitted
pnpm visual-coverage --changed --prs          # also mark files that an open PR is about to cover
pnpm visual-coverage <path> [<path>...]       # specific files
pnpm visual-coverage                          # whole tree, one row per area
pnpm visual-coverage --uncovered              # whole tree plus every uncovered file
pnpm visual-coverage --format json ...        # machine-readable, same modes
pnpm visual-coverage --help
```

For a PR you are not on: `gh pr checkout <number> && pnpm visual-coverage --changed --prs`. Every
same-repo PR that touches `packages/**/src/**/*.tsx` or `*.css.ts` also gets a sticky
"Visual regression coverage" comment from `.github/workflows/visual-coverage.yml`, produced by the
same script with `--format markdown --prs`. Read that comment first when reviewing.

The script is `scripts/visualCoverage.ts`. It has no dependencies and runs under `tsx` or plain
Node 22.18+ (`node scripts/visualCoverage.ts`).

## What counts as covered

Chromatic snapshots stories, not components. A component is covered when a story renders it. The
script models that as direct imports:

| Evidence       | Files                                           | Chromatic project | Status in the report                                                        |
| -------------- | ----------------------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| `story`        | `packages/**/src/**/*.stories.tsx`              | Storybook, active | `covered`                                                                   |
| `browser-test` | `packages/**/src/**/*.browser.test.tsx`         | Vitest, dormant   | `covered`, flagged "no Chromatic snapshot yet" until the Vitest token lands |
| `pending`      | a `*.stories.tsx` added by an open PR (`--prs`) | none yet          | `pending`, claimed by that PR                                               |

A file is covered when a story or browser test imports it directly, or imports a `*Story.tsx`
harness that imports it. A `.css.ts` file inherits the coverage of the `.tsx` files that import
it. Nothing deeper than that counts. `TestWrapper` imports the whole `sanity` package, so a
transitive graph would mark everything covered, and Chromatic's TurboSnap has the same blind
spot. That is why the green Chromatic check on a PR says only "the affected stories still
match", never "your component is rendered by a story".

## How stories map to Studio UI

- `dev/storybook` is the host. Its `stories` glob in `dev/storybook/.storybook/main.ts` finds
  `*.stories.tsx` under every workspace package's `src`. Stories live next to the component in
  its `__tests__` directory. Nothing lives under `dev/storybook/stories`.
- Two story shapes. Plain variant grids for `packages/sanity/src/ui-components` wrappers
  (`Button.stories.tsx` imports `../Button`). Harness stories for anything that needs a
  workspace, i18n, or layers. The harness is `<Name>Story.tsx`, wraps `TestWrapper`, and is shared
  with the `<Name>.browser.test.tsx` when one exists. `<Name>.stories.tsx` is then a thin CSF file
  whose `component` is the harness.
- "ui5 sentinel" and "box sentinel" are the same thing. A story added so the `@sanity/ui` to
  `ui5` Box/Flex/Card migration gets a snapshot before the swap lands. The harness renders the
  states most likely to drift (tones, spacing, truncation, empty states) with fixture copy only.
  Naming follows the harness pattern above. `title` is `Area/Component`. Pure regression
  fixtures carry `tags: ['!dev', '!autodocs', 'vrt-only']` so they stay out of the sidebar but in
  the snapshot set. Read `FieldDiffChromeStory.tsx` and `FieldDiffChrome.stories.tsx` under
  `packages/sanity/src/core/field/diff/components/__tests__` as the reference pair.
- A story covers exactly the components its harness imports. A `DocumentLayout` story also
  paints buttons and cards, but only the `Button` story is the sentinel for `Button`.

## Decision procedure

Run `pnpm visual-coverage --changed --prs` on the branch, then per file:

1. `covered`. Done. If the change adds a state the story does not render (a new tone, an empty
   state, a truncation case), extend the existing story or harness. Do not add a second story
   for the same component.
2. `pending`. Do not add a story. The PR number is in the report. Review that PR, or comment on
   it if the variant you need is missing.
3. `uncovered`, and the file paints something (layout, tone, spacing, text). Add coverage per
   `.agents/skills/sanity-visual-regression/SKILL.md`. Reuse an existing `*Story.tsx` harness
   in the same directory before creating one.
4. `uncovered`, and the file is a provider, hook wrapper, context, or renders only children.
   Nothing to snapshot. Say so in the PR instead of adding a story.

For migration planning, `pnpm visual-coverage --uncovered --prs` lists the gap. Pick from it, do
not survey by hand.

## Avoiding duplicate coverage PRs

Sentinel coverage for the ui5 migration is being added in a stack of PRs titled
`test(storybook): add ui5 ... sentinels ...`, on branches named
`cursor/ui5-visual-regression-coverage-*` (base of the stack is
[#14056](https://github.com/sanity-io/sanity/pull/14056), tip at the time of writing is
[#14511](https://github.com/sanity-io/sanity/pull/14511)). The migration itself lands on
`chore/ui-v5-*` branches.

- `--prs` already accounts for every open PR that adds a `*.stories.tsx`. A file reported as
  `pending` is claimed.
- To see the stack: `gh pr list --state open --search "test(storybook) in:title" --json number,title,headRefName,baseRefName`.
- Do not rebase, rewrite, or push to those branches. A new coverage PR goes on top of the stack
  tip when it depends on a harness added there, or off `main` when its files are disjoint from
  every open PR.
- Before opening a coverage PR, run the check with `--prs` one more time. If anything you added
  is now `pending` elsewhere, drop it.
