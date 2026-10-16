import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {removeCascadeLayers} from '@sanity/pandacss-tsdown-plugin/vite'
import {normalizePath, type Plugin} from 'vite'

/**
 * The stylesheet `@pandacss/vite` fills with the generated CSS, as the app imports it. An app
 * that builds `sanity` from source imports it from its entry: a studio through
 * `studioPandaCss()`, Storybook and the vitest browser setup themselves.
 */
export const PANDA_LAYERS_CSS_SPECIFIER = '@repo/pandacss/layers.css'

/** `layers.css` as a Vite module id: an absolute path with forward slashes on every platform. */
const PANDA_LAYERS_CSS_ID = normalizePath(fileURLToPath(new URL('./layers.css', import.meta.url)))

/**
 * The cascade layers Panda writes its rules into (the default names, which both Panda projects
 * use), and `layers.css` declares. `removeCascadeLayers()` takes them out of the CSS again, so the
 * dev stylesheet cascades like the published `bundle.css` (`panda: {cascadeLayers: false}`); the
 * `@layer sui;` statement ahead of them in `layers.css` is not Panda's and stays.
 */
export const PANDA_LAYER_NAMES: readonly string[] = [
  'reset',
  'base',
  'tokens',
  'recipes',
  'utilities',
]

const SANITY_PACKAGE_DIR = fileURLToPath(new URL('../../../sanity/', import.meta.url))

/** The entry both `sanity dev` and `sanity build` write for a studio (`.sanity/runtime/app.js`). */
const RE_SANITY_RUNTIME_ENTRY = /[\\/]\.sanity[\\/]runtime[\\/]app\.js$/

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * A `@pandacss/vite` instance for one Panda project, transforming only the modules under that
 * project's directory (plus `layers.css`, which every instance fills). The plugin itself hands
 * every `.ts`/`.tsx` module of the build to its transformer, whichever project it belongs to, so
 * with several instances the first one would rewrite another project's `.css.ts` modules with its
 * own class name prefix — and the CSS for those names would be missing.
 */
function scopedPandacss(cwd: string): Plugin {
  const plugin = pandacss({cwd, transform: true})
  const {transform} = plugin
  if (!transform || typeof transform === 'function') return plugin

  const ids = [
    new RegExp(`^${escapeRegExp(normalizePath(cwd))}`),
    new RegExp(`^${escapeRegExp(PANDA_LAYERS_CSS_ID)}(?:\\?|$)`),
  ]

  return {
    ...plugin,
    transform: {...transform, filter: {...transform.filter, id: ids}},
  }
}

/**
 * Imports `layers.css` from the studio runtime entry, so the CSS the `pandacss()` instances
 * generate reaches the page: under `sanity dev` the CSS of the `sanity` sources (the `monorepo`
 * export condition), and under either command the CSS of the studio's own Panda project. A
 * `sanity build` resolves the built package instead, whose entries import their own `bundle.css`,
 * which is why a studio registers an instance for its own `roots` only then. The specifier
 * resolves through the studio's own `@repo/pandacss` dependency.
 */
function studioRuntimeLayersCss(): Plugin {
  return {
    name: 'repo:studio-runtime-panda-layers-css',
    transform: {
      filter: {id: RE_SANITY_RUNTIME_ENTRY},
      handler(code) {
        return {code: `import ${JSON.stringify(PANDA_LAYERS_CSS_SPECIFIER)}\n${code}`, map: null}
      },
    },
  }
}

export interface StudioPandaCssOptions {
  /**
   * Whether the app resolves the `.css.ts` sources of the `sanity` package, which then get their
   * own `@pandacss/vite` instance. Pass `false` for a `sanity build`, which resolves the built
   * package and its `bundle.css` instead of the sources.
   * @defaultValue true
   */
  sanity?: boolean
  /**
   * Directories with a `panda.config.ts` of their own whose `.css.ts` sources the app also
   * builds, e.g. a dev studio that styles its own plugins with Panda. Unlike the `sanity`
   * package, these have no prebuilt `bundle.css`, so a studio passes them for `sanity build` too.
   * Every project appends its CSS to the same `layers.css`.
   */
  roots?: string[]
}

/**
 * The Vite plugins a studio, Storybook or test runner needs to build Panda projects from their
 * TypeScript sources: `@pandacss/vite` for each project (rewriting the `css()` calls of its
 * `.css.ts` modules to class names and generating the CSS), `removeCascadeLayers()` from
 * `@sanity/pandacss-tsdown-plugin/vite` (the pass behind the `cascadeLayers: false` option the
 * published `bundle.css` is built with, applied to the CSS `@pandacss/vite` generates), and the
 * `layers.css` import for the studio runtime entry.
 */
export function studioPandaCss(options: StudioPandaCssOptions = {}): Plugin[] {
  const roots = [
    ...(options.sanity === false ? [] : [SANITY_PACKAGE_DIR]),
    ...(options.roots ?? []),
  ]

  return [
    ...roots.map(scopedPandacss),
    removeCascadeLayers(PANDA_LAYER_NAMES),
    studioRuntimeLayersCss(),
  ]
}
