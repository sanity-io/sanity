import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {removeCascadeLayers} from '@sanity/pandacss-tsdown-plugin/vite'
import {type Plugin} from 'vite'

/** The `sanity` package: the repository's only Panda CSS project (packages/sanity/panda.config.ts). */
const SANITY_PACKAGE_DIR = fileURLToPath(new URL('../../../sanity/', import.meta.url))
/** The stylesheet `@pandacss/vite` fills with the generated CSS (`@repo/pandacss/panda.css`). */
const PANDA_CSS = fileURLToPath(new URL('./panda.css', import.meta.url))
/** The entry `sanity dev` and `sanity build` write for a studio. */
const RE_STUDIO_RUNTIME_ENTRY = /[\\/]\.sanity[\\/]runtime[\\/]app\.js(?:\?|$)/

export interface SanityPandaCssOptions {
  /**
   * Module ids of the app entry to import the generated stylesheet from, for apps whose entry is
   * not theirs to edit (a studio's `.sanity/runtime/app.js`, see `studioPandaCss()`). Apps that
   * own their entry import `@repo/pandacss/panda.css` from it instead.
   */
  entry?: RegExp
}

/**
 * Builds the `sanity` package's Panda CSS from source, for the Vite apps that resolve the package
 * to its sources (the `monorepo` export condition) instead of the built `lib/`. Those apps bundle
 * the package's `.css.ts` modules themselves, so the `@pandacss/vite` instance points at the
 * package's Panda project: it rewrites the `css()` calls to class names and generates their CSS
 * into `@repo/pandacss/panda.css` — the counterpart of the `sanity/bundle.css` import the built
 * package carries — and `removeCascadeLayers()` takes Panda's cascade layers out of that CSS
 * again, as `cascadeLayers: false` does for `bundle.css` (packages/sanity/tsdown.config.ts).
 *
 * Nothing here is needed where `sanity` resolves to the built package: its entries import
 * `sanity/bundle.css`, a plain stylesheet that Vite's built-in CSS support handles.
 */
// No return type: `vite` resolves to one copy for an app and to another for the plugins (two
// peer variants in the lockfile), whose `Plugin` types are not interchangeable
export function sanityPandaCss({entry}: SanityPandaCssOptions = {}) {
  const pandaCssImport: Plugin | undefined = entry && {
    name: 'repo:panda-css-import',
    transform: {
      filter: {id: entry},
      handler: (code) => ({code: `import ${JSON.stringify(PANDA_CSS)}\n${code}`, map: null}),
    },
  }
  return [
    pandacss({cwd: SANITY_PACKAGE_DIR, transform: true}),
    removeCascadeLayers(['reset', 'base', 'tokens', 'recipes', 'utilities']),
    ...(pandaCssImport ? [pandaCssImport] : []),
  ]
}

/**
 * `sanityPandaCss()` for a studio's `sanity.cli.ts`: imports the generated stylesheet from the
 * runtime entry `sanity dev` writes, which a studio has no other way to add an import to. Register
 * it for `command === 'serve'` only — `sanity build` resolves the built package and its
 * `bundle.css`.
 */
export function studioPandaCss() {
  return sanityPandaCss({entry: RE_STUDIO_RUNTIME_ENTRY})
}
