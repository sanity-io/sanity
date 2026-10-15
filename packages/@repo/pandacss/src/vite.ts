import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {normalizePath, type Plugin} from 'vite'

import {unwrapCascadeLayers} from './unwrapCascadeLayers.ts'

/**
 * The stylesheet `@pandacss/vite` fills with the generated CSS, as the app imports it. An app
 * that builds `sanity` from source imports it from its entry: a studio through
 * `studioPandaCss()`, Storybook and the vitest browser setup themselves.
 */
export const PANDA_LAYERS_CSS_SPECIFIER = '@repo/pandacss/layers.css'

/** `layers.css` as a Vite module id: an absolute path with forward slashes on every platform. */
const PANDA_LAYERS_CSS_ID = normalizePath(fileURLToPath(new URL('./layers.css', import.meta.url)))

const SANITY_PACKAGE_DIR = fileURLToPath(new URL('../../../sanity/', import.meta.url))
const VISION_PACKAGE_DIR = fileURLToPath(new URL('../../../@sanity/vision/', import.meta.url))

/** The entry both `sanity dev` and `sanity build` write for a studio (`.sanity/runtime/app.js`). */
const RE_SANITY_RUNTIME_ENTRY = /[\\/]\.sanity[\\/]runtime[\\/]app\.js$/

function stripQuery(id: string): string {
  return id.split('?')[0] ?? id
}

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
 * `@sanity/vanilla-extract-vite-plugin` for the `.css.ts` sources of `@sanity/vision`, which
 * still writes them in vanilla-extract until it moves to CSS modules. A studio that resolves the
 * workspace packages to their sources (`sanity dev`) registers it next to `studioPandaCss()`.
 * The plugin compiles every `.css.ts` module of a build as vanilla-extract, so its transform is
 * limited to that package's directory: the `.css.ts` modules of `sanity` and of the studios are
 * Panda CSS and do not import `@vanilla-extract/css`.
 */
export function visionVanillaExtractPlugin(): Plugin[] {
  const ids = new RegExp(
    `^${escapeRegExp(normalizePath(VISION_PACKAGE_DIR))}.*\\.css\\.(?:js|cjs|mjs|jsx|ts|tsx)(?:\\?|$)`,
  )

  return vanillaExtractPlugin().map((plugin) => {
    const {transform} = plugin
    if (plugin.name !== 'sanity-vanilla-extract' || !transform || typeof transform === 'function') {
      return plugin
    }
    return {...plugin, transform: {...transform, filter: {...transform.filter, id: ids}}}
  })
}

/**
 * Unwraps the `@layer` blocks `@pandacss/vite` appends to `layers.css`, keeping the order
 * statements the file opens with. Register it after the `pandacss()` instances, as
 * `studioPandaCss()` and `@repo/package.bundle` do. See `unwrapCascadeLayers` for why, and for
 * how long.
 */
export function unlayeredPandaCss(): Plugin {
  return {
    name: 'repo:unlayered-panda-css',
    enforce: 'pre',
    transform: {
      filter: {id: /\.css(?:$|\?)/},
      handler(code, id) {
        if (stripQuery(id) !== PANDA_LAYERS_CSS_ID) return null
        return {code: unwrapCascadeLayers(code), map: null}
      },
    },
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
 * `.css.ts` modules to class names and generating the CSS), the layer removal, and the
 * `layers.css` import for the studio runtime entry.
 */
export function studioPandaCss(options: StudioPandaCssOptions = {}): Plugin[] {
  const roots = [
    ...(options.sanity === false ? [] : [SANITY_PACKAGE_DIR]),
    ...(options.roots ?? []),
  ]

  return [...roots.map(scopedPandacss), unlayeredPandaCss(), studioRuntimeLayersCss()]
}
