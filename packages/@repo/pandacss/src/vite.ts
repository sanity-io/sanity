import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {type Plugin} from 'vite'

import {unwrapCascadeLayers} from './unwrapCascadeLayers.ts'

/**
 * The stylesheet `@pandacss/vite` fills with the generated CSS, as the app imports it. An app
 * that builds `sanity` or `@sanity/vision` from source imports it from its entry: `sanity dev`
 * through `studioPandaCss()`, Storybook and the vitest browser setup themselves.
 */
export const PANDA_LAYERS_CSS_SPECIFIER = '@repo/pandacss/layers.css'

const PANDA_LAYERS_CSS_PATH = fileURLToPath(new URL('./layers.css', import.meta.url))

const SANITY_PACKAGE_DIR = fileURLToPath(new URL('../../../sanity/', import.meta.url))
const VISION_PACKAGE_DIR = fileURLToPath(new URL('../../../@sanity/vision/', import.meta.url))

/** The runtime entry `sanity dev` writes and serves (`.sanity/runtime/app.js`). */
const RE_SANITY_RUNTIME_ENTRY = /[\\/]\.sanity[\\/]runtime[\\/]app\.js$/

function stripQuery(id: string): string {
  return id.split('?')[0] ?? id
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
        if (stripQuery(id) !== PANDA_LAYERS_CSS_PATH) return null
        return {code: unwrapCascadeLayers(code), map: null}
      },
    },
  }
}

/**
 * Imports `layers.css` from the runtime entry of `sanity dev`, so a dev studio that resolves
 * `sanity` to its sources (the `monorepo` export condition) also gets the CSS of those sources.
 * A `sanity build` resolves the built packages instead, whose entries import their own
 * `bundle.css`, so this only applies to the dev server. The specifier resolves through the
 * studio's own `@repo/pandacss` dependency.
 */
function sanityDevLayersCss(): Plugin {
  return {
    name: 'repo:sanity-dev-panda-layers-css',
    apply: 'serve',
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
   * their CSS to the same `layers.css`.
   * @defaultValue `['sanity', '@sanity/vision']`
   */
  packages?: Array<'sanity' | '@sanity/vision'>
  /**
   * Directories with a `panda.config.ts` of their own whose `.css.ts` sources the app also
   * builds, e.g. a dev studio that styles its own plugins with Panda.
   */
  roots?: string[]
}

/**
 * The Vite plugins a dev studio, Storybook or test runner needs to build `sanity` and
 * `@sanity/vision` from their TypeScript sources: `@pandacss/vite` for each Panda project
 * (rewriting the `css()` calls of its `.css.ts` modules to class names and generating the CSS),
 * the layer removal, and the `layers.css` import for the `sanity dev` runtime entry.
 */
export function studioPandaCss(options: StudioPandaCssOptions = {}): Plugin[] {
  const packages = options.packages ?? ['sanity', '@sanity/vision']
  const roots = [
    ...packages.map((name) => (name === 'sanity' ? SANITY_PACKAGE_DIR : VISION_PACKAGE_DIR)),
    ...(options.roots ?? []),
  ]

  return [
    ...roots.map((cwd) => pandacss({cwd, transform: true})),
    unlayeredPandaCss(),
    sanityDevLayersCss(),
  ]
}
