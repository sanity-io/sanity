import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {defineConfig} from '@repo/test-config/vitest'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import viteReact from '@vitejs/plugin-react'

/** The `sanity` package: the repository's only Panda CSS project (packages/sanity/panda.config.ts). */
const SANITY_PACKAGE_DIR = fileURLToPath(new URL('../../sanity/', import.meta.url))
/** Module ids of its sources (Vite ids use forward slashes on every platform). */
const RE_SANITY_PACKAGE_SOURCE = /\/packages\/sanity\/src\//

/**
 * `@sanity/vanilla-extract-vite-plugin` for this package's own `.css.ts` modules. The plugin
 * compiles every `.css.ts` module of a build as vanilla-extract, so the `sanity` package's — Panda
 * CSS, built by the `@pandacss/vite` instance below — are excluded from its transform's hook filter
 * here; unscoped, it compiles them as vanilla-extract and fails on the missing `@vanilla-extract/css`
 * import. Throws rather than failing open when the plugin's name or hook shape changes, so an
 * upstream change shows up here and not as this suite compiling `sanity`'s modules. Both this
 * wrapper and the plugin go once this package moves to CSS modules (#15406).
 */
function vanillaExtractExceptSanity() {
  const plugins = vanillaExtractPlugin()
  const plugin = plugins.find((candidate) => candidate.name === 'sanity-vanilla-extract')
  const transform = plugin?.transform
  const include = typeof transform === 'object' ? transform.filter?.id : undefined
  if (!plugin || typeof transform !== 'object' || !(include instanceof RegExp)) {
    throw new Error(
      '@sanity/vanilla-extract-vite-plugin changed its plugin name or transform hook shape; update vanillaExtractExceptSanity() in vitest.config.mts',
    )
  }
  return plugins.map((candidate) =>
    candidate === plugin
      ? {
          ...plugin,
          transform: {
            ...transform,
            filter: {...transform.filter, id: {include, exclude: RE_SANITY_PACKAGE_SOURCE}},
          },
        }
      : candidate,
  )
}

// Two `.css.ts` compilers meet in this suite. Vision's own `.css.ts` modules are vanilla-extract
// and still need its transform in jsdom for file scoping (they throw "Styles were unable to be
// assigned to a file" without it); style *injection* is skipped via `disableRuntimeStyles` below,
// since no jsdom test asserts on styles or vanilla-extract class names. The `sanity` sources the
// tests resolve to (the `monorepo` condition) are Panda CSS, so their `.css.ts` modules get the
// `@pandacss/vite` instance pointed at that package, which rewrites their `css()` calls to class
// names; no stylesheet is loaded in jsdom.
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: [
      '@vanilla-extract/css/disableRuntimeStyles',
      // Fail tests during which react-dom reports a prop leaking onto a DOM element
      '@repo/test-config/vitest/failOnReactDomPropWarnings',
    ],
  },
  plugins: [
    ...vanillaExtractExceptSanity(),
    pandacss({cwd: SANITY_PACKAGE_DIR, transform: true}),
    // React Compiler through `oxc-transform-react` (no babel), same as packages/sanity
    viteReact({compiler: {target: '19'}}),
  ],
})
