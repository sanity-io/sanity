# @repo/pandacss

The Panda CSS wiring for the apps in this repository that build the `sanity` package from source
under Vite, so that edits to the package's `.css.ts` modules hot-reload. It is **not** needed by a
studio or app that uses the built package.

## When an app needs it

The `sanity` package's static styles are Panda CSS (`packages/sanity/panda.config.ts`, the
repository's only Panda project). The published build compiles the `.css.ts` modules to class
names and writes their CSS to one stylesheet, which every entry imports as `sanity/bundle.css`
(`packages/sanity/tsdown.config.ts`). That is a plain stylesheet: Vite's built-in CSS support
loads it, so a `sanity build`, `sanity dev` in a studio that installs `sanity` from npm, and any
other Vite app that resolves `sanity` to its built `lib/` need no Panda plugin at all.

The dev studios, Storybook, the vitest browser suite and `dev/studio-diagnostics-viewer` resolve
the workspace packages to their TypeScript sources instead (the `monorepo` export condition), so
that source edits reflect live without a `pnpm build`. The `.css.ts` modules are then bundled as
source too, and something has to compile them: that is what this package provides.

## What it does

`sanityPandaCss()` returns the Vite plugins:

- `pandacss({cwd: <packages/sanity>, transform: true})` from `@pandacss/vite`, pointed at the
  package's Panda project. It rewrites the `css()` calls to class names in place and generates
  their CSS into the stylesheet this package exports as `@repo/pandacss/panda.css` — the
  counterpart of the built package's `sanity/bundle.css` import — and re-generates it when a
  `.css.ts` module or the Panda config changes.
- `removeCascadeLayers()` from `@sanity/pandacss-tsdown-plugin/vite`, which takes Panda's cascade
  layers out of that CSS again. The published `bundle.css` is built with `cascadeLayers: false`,
  so the rules cascade the same way in both.
- With the `entry` option, a plugin that imports the stylesheet from the module ids it matches, for
  apps whose entry is not theirs to edit. `studioPandaCss()` is that for a studio's
  `sanity.cli.ts`: it targets the `.sanity/runtime/app.js` entry `sanity dev` writes.

An app that owns its entry imports the stylesheet directly instead:

```ts
import '@repo/pandacss/panda.css'
```

## Usage

A studio's `sanity.cli.ts` registers the plugins for `sanity dev` only; `sanity build` resolves
the built package and its `bundle.css`:

```ts
import {studioPandaCss} from '@repo/pandacss/vite'

export default defineCliConfig({
  vite(viteConfig, {command}) {
    return mergeConfig(viteConfig, {
      plugins: command === 'serve' ? studioPandaCss() : [],
      optimizeDeps: {exclude: ['sanity']},
    })
  },
})
```

Other Vite apps register `sanityPandaCss()` in their config and import `@repo/pandacss/panda.css`
from their entry or setup file (the Storybook preview, `packages/sanity/test/setup/browser.ts`), or
pass `entry` to have the import injected (`dev/studio-diagnostics-viewer`).

The `jsdom` vitest configs are not consumers: they run the Panda transform for the class names only
and never load the generated CSS, so they register `pandacss()` themselves. The CDN bundle in
`@repo/package.bundle` builds the package for publishing and keeps its own import plugin.
