import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {normalizePath, type Plugin} from 'vite'

import {unwrapCascadeLayers} from './unwrapCascadeLayers.ts'

/**
 * The stylesheet `@pandacss/vite` fills with the generated CSS, as the app imports it. An app
 * that builds `sanity` or `@sanity/vision` from source imports it from its entry: a studio
 * through `studioPandaCss()`, Storybook and the vitest browser setup themselves.
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
 * Drops the cascade layers from `layers.css` once `@pandacss/vite` has appended the generated
 * CSS to it. Register it after the `pandacss()` instances, as `studioPandaCss()` and
 * `@repo/package.bundle` do. See `unwrapCascadeLayers` for the reason.
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
 * generate reaches the page: under `sanity dev` the CSS of the `sanity` and `@sanity/vision`
 * sources (the `monorepo` export condition), and under either command the CSS of the studio's own
 * Panda project. A `sanity build` resolves the built packages instead, whose entries import their
 * own `bundle.css`, which is why a studio registers instances for its own `roots` only then. The
 * specifier resolves through the studio's own `@repo/pandacss` dependency.
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
   * The workspace packages whose `.css.ts` sources the app resolves. Each one gets its own
   * `@pandacss/vite` instance, since each has its own `panda.config.ts`; all of them append
   * their CSS to the same `layers.css`. Pass `[]` for a `sanity build`, which resolves the built
   * packages and their `bundle.css` instead of the sources.
   * @defaultValue `['sanity', '@sanity/vision']`
   */
  packages?: Array<'sanity' | '@sanity/vision'>
  /**
   * Directories with a `panda.config.ts` of their own whose `.css.ts` sources the app also
   * builds, e.g. a dev studio that styles its own plugins with Panda. Unlike the workspace
   * packages, these have no prebuilt `bundle.css`, so a studio passes them for `sanity build` too.
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
  const packages = options.packages ?? ['sanity', '@sanity/vision']
  const roots = [
    ...packages.map((name) => (name === 'sanity' ? SANITY_PACKAGE_DIR : VISION_PACKAGE_DIR)),
    ...(options.roots ?? []),
  ]

  return [...roots.map(scopedPandacss), unlayeredPandaCss(), studioRuntimeLayersCss()]
}
