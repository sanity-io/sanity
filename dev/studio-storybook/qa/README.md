# Storybook QA regression gate

One command to answer "is the catalog still clean?" It sweeps a built Storybook headlessly,
classifies every entry, and reports only entries that got **worse** than a committed baseline,
so known timing artifacts and intentional empty states stay quiet.

## Run it

```bash
# build the catalog, then gate it
npm run build            # storybook build -o storybook-static
npm run qa               # sweeps storybook-static, diffs against qa/baseline.json

# or point at any static build directory
node qa/run.mjs --dir /path/to/storybook-static
```

Exit code is `1` if there are regressions, `0` if clean. That makes it usable as a CI or
pre-release gate.

## How it classifies (real signals, not artifacts)

Per entry, in order of severity:

- **fail** - an uncaught `pageerror`, or a _visible_ Storybook error overlay. (Storybook keeps
  a hidden `.sb-errordisplay` in every iframe; only a rendered one counts.)
- **empty** - the story root has no visible descendant.
- **warn** - a non-benign `console.error` (React `act()`/`defaultProps`/DevTools notices and
  isolated 40x mock-asset fetches are treated as benign).
- **ok** - renders with content and no real errors.

Docs entries are swept in `viewMode=docs` with a longer settle. Heavy stories (CodeMirror,
panes, live-engine mocks) paint seconds late, so the sweep uses a settle window; anything still
blank is recorded as `empty` in the baseline, and the gate only flags a _change_ from that.

## The baseline

`qa/baseline.json` maps every entry id to its known-good status. The gate diffs against it:

- **regression** - an entry that got worse than baseline (e.g. `ok -> fail`). This fails the gate.
- **improved** - an entry that got better (informational).
- **new** - an entry not in the baseline that fails/empties (add it to the baseline if intended).

Accept the current state as the new baseline (after an intended change) with:

```bash
node qa/run.mjs --dir /path/to/storybook-static --update-baseline
```

## Options

`--dir` (required) a Storybook static build directory · `--settle <ms>` render wait (default 2500) · `--concurrency <n>` parallel pages (default 6) · `--update-baseline` write the baseline
instead of diffing · `--baseline <path>` override the baseline file.

## Notes

Depends only on Playwright (already in the repo). The runner has its own tiny static server, so
it needs no `http-server`. It works for the plugins and SDK catalogs too: point `--dir` at their
builds and keep a baseline per catalog. This is the operational tool behind the `storybook-qa`
skill and chapter 09 of the Storybook Codex.

## The interaction gate (`qa/interact.mjs`, `npm run qa:interact`)

The render gate above answers one question: _did it mount?_ That is not enough, and we know it is
not enough because it once passed a menu that crashed the moment anyone clicked it.

`useCanInviteProjectMembers` (PresenceMenu, ManageMenu) fetches project grants and is gated on
`enabled: open`. The request therefore only fires when the menu opens, so the story mounted clean,
baselined `ok`, and threw on the first human click. A render-level probe cannot catch that class of
defect by construction.

The interaction gate DRIVES stories and asserts on what happens after:

1. **throw** - any pageerror raised during or after an interaction.
2. **crop** - a floating layer that either escapes the viewport OR, more commonly, stays inside it
   and truncates its own content. `@sanity/ui` popovers constrain themselves rather than
   overflowing, so a probe that only checks overflow reports "fine" on a visibly cut-off menu.
3. **expect** - an explicit post-condition, so "the click did nothing" fails loudly.

Specs live in `qa/interactions.mjs`. Every spec with steps runs TWICE: once at 1280x900 and once at
a tight 900x420, because cropping is a small-canvas defect by nature. A failing spec is retried once
with more patience before being reported, since interaction timing is far noisier than render
timing and a gate that cries wolf is a gate people stop reading.

    npm run qa:interact                                   # against storybook-static
    node qa/interact.mjs --url http://localhost:6060      # against the dev server, for iteration
    node qa/interact.mjs --url http://localhost:6060 --only presence
    node qa/interact.mjs --dir storybook-static --shots qa/shots

Add a spec whenever a story's whole point is that you can open it, type into it, or pick something
in it. A story that only renders is covered by the render gate and needs nothing here.
