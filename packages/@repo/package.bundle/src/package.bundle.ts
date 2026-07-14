import babel from '@rolldown/plugin-babel'
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import viteReact, {reactCompilerPreset} from '@vitejs/plugin-react'
import escapeRegExp from 'lodash-es/escapeRegExp.js'
import {esmExternalRequirePlugin, type Plugin, type UserConfig} from 'vite'

import packageJson from '../package.json' with {type: 'json'}

export const defaultConfig: UserConfig = {
  appType: 'custom',
  define: {
    '__SANITY_STAGING__': process.env.SANITY_INTERNAL_ENV === 'staging',
    '__PKG_VERSION__': JSON.stringify(packageJson.version),
    'process.env.NODE_ENV': '"production"',
    'process.env': {},
  },
  plugins: [
    viteReact(),
    babel({presets: [reactCompilerPreset({target: '19'})]}),
    vanillaExtractPlugin(),
    cleanupCssOutputPlugin(),
    esmExternalRequirePlugin({
      // self-externals are required here in order to ensure that the presentation
      // tool and future transitive dependencies that require sanity do not
      // re-include sanity in their bundle
      external: ['react', 'react-dom', 'styled-components', 'sanity', '@sanity/vision'].flatMap(
        (dependency) => [
          dependency,
          // this matches `react/jsx-runtime`, `sanity/presentation` etc
          new RegExp(`^${escapeRegExp(dependency)}\\/`),
        ],
      ),
    }),
  ],
  build: {
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {},
      formats: ['es'],
    },
    rolldownOptions: {
      output: {
        minify: true,
        exports: 'named',
        dir: 'dist',
        format: 'es',
        // Due to module server expecting `.mjs`, and packages/sanity/package.json#type now being `module`, it's necessary to configure vite to continue using `.mjs`
        // Otherwise it'll start using `.js` instead: https://github.com/vitejs/vite/blob/a3cd262f37228967e455617e982b35fccc49ffe9/packages/vite/src/node/build.ts#L664-L679
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name]-[hash].mjs',
        // CSS assets get a predictable name so the module server can serve them at a known URL
        assetFileNames: (assetInfo) =>
          assetInfo.names?.some((n) => n.endsWith('.css')) ? 'index.css' : '[name]-[hash][extname]',
      },
      transform: {
        // Same options as pkg-utils: https://github.com/sanity-io/pkg-utils/blob/f4e229e2641049008b375caf67576130be83fcdd/packages/%40sanity/pkg-utils/src/node/tasks/rollup/resolveRollupConfig.ts#L220-L227
        plugins: {
          styledComponents: {
            // Unnecessary, as the way we use styled-components in Sanity is usually by wrapping `@sanity/ui` primitives, not declaring new ones like "const Button = styled.button``"
            fileName: false,
            // Native template literals take less space than this transpilation
            transpileTemplateLiterals: false,
            // Massively helps dead code elimination and tree-shaking
            pure: true,
            // disabled, as pkg-utils tends to be used for npm publishing, while other tooling, like `sanity dev`, `next dev`, etc are used for testing
            cssProp: false,
          },
        },
      },
      treeshake: true,
    },
  },
}

/**
 * Matches Vite's internal "hash update marker": a CSS comment of the form
 * `$vite$:N` that Rolldown's `vite-css-post` plugin appends to finalized CSS to
 * force a different content hash (a workaround for a Chromium `crossorigin`
 * caching bug, https://github.com/vitejs/vite/issues/18038).
 *
 * The marker is meant to be stripped again before the asset is written, but
 * Rolldown's library / non-code-split path (`build.lib` defaults
 * `cssCodeSplit` to `false`) emits the combined CSS asset late in
 * `generateBundle`, after its own strip step has already run, so the marker
 * leaks into the published CSS. We remove it ourselves below. This mirrors
 * Vite's own `viteHashUpdateMarkerRE`.
 */
const VITE_HASH_UPDATE_MARKER_RE = /\/\*\$vite\$:\d+\*\//g

/**
 * Cleans up the CSS-related output of the CDN bundle build:
 *
 * 1. Strips CSS imports from JS chunks, but ONLY for CSS files that were
 *    produced by the current build (e.g., by vanilla-extract). When building
 *    CDN bundles, CSS is served separately via `<link>` tags (injected by the
 *    CLI's runtime script), so the JS bundles should not contain CSS import
 *    side-effects for these extracted CSS files. CSS imports from third-party
 *    packages that were bundled in (and whose CSS was processed into the same
 *    output) are safe to strip too — their styles end up in the combined CSS
 *    asset served via `<link>`. Imports referencing CSS files NOT present in
 *    the bundle output are left untouched, since stripping them could lose
 *    styles that aren't in our CSS output.
 *
 * 2. Removes the leftover Vite hash-update marker (see
 *    {@link VITE_HASH_UPDATE_MARKER_RE}) from the emitted CSS assets so the CSS
 *    we publish to the CDN stays clean.
 */
export function cleanupCssOutputPlugin(): Plugin {
  return {
    name: 'sanity/cleanup-css-output',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      // 1. Collect CSS asset filenames produced by this build (e.g.,
      //    vanilla-extract output, Vite-processed CSS imports) and, while we're
      //    iterating, strip the internal Vite hash-update marker from each CSS
      //    asset's source.
      const cssAssetNames = new Set<string>()
      for (const [fileName, entry] of Object.entries(bundle)) {
        if (entry.type === 'asset' && fileName.endsWith('.css')) {
          cssAssetNames.add(fileName)
          if (typeof entry.source === 'string') {
            entry.source = entry.source.replace(VITE_HASH_UPDATE_MARKER_RE, '')
          }
        }
      }

      if (cssAssetNames.size === 0) return

      // 2. Only strip imports that reference these specific CSS assets
      for (const [, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue

        for (const cssName of cssAssetNames) {
          const escaped = cssName.replace(/\./g, '\\.')
          const pattern = new RegExp(`import\\s+['"][^'"]*${escaped}['"];?\\n?`, 'g')
          chunk.code = chunk.code.replace(pattern, '/* css served separately via <link> tag */\n')
        }
      }
    },
  }
}
