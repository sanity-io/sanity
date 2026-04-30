import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import escapeRegExp from 'lodash-es/escapeRegExp.js'
import {type Plugin, type UserConfig} from 'vite'

import packageJson from '../package.json' with {type: 'json'}

export const defaultConfig: UserConfig = {
  appType: 'custom',
  define: {
    '__SANITY_STAGING__': process.env.SANITY_INTERNAL_ENV === 'staging',
    'process.env.PKG_VERSION': JSON.stringify(packageJson.version),
    'process.env.NODE_ENV': '"production"',
    'process.env': {},
  },
  plugins: [
    react({
      babel: {plugins: [['babel-plugin-react-compiler', {target: '19'}]]},
    }),
    vanillaExtractPlugin(),
    stripCssImportsPlugin(),
  ],
  build: {
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {},
      formats: ['es'],
    },
    rollupOptions: {
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
      output: {
        exports: 'named',
        dir: 'dist',
        format: 'es',
        // Due to module server expecting `.mjs`, and packages/sanity/package.json#type now being `module`, it's necessary to configure vite to continue using `.mjs`
        // Otherwise it'll start using `.js` instead: https://github.com/vitejs/vite/blob/a3cd262f37228967e455617e982b35fccc49ffe9/packages/vite/src/node/build.ts#L664-L679
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name]-[hash].mjs',
        // CSS assets get a predictable name so the module server can serve them at a known URL
        assetFileNames: (assetInfo) =>
          assetInfo.names?.some((n) => n.endsWith('.css')) ? 'bundle.css' : '[name]-[hash][extname]',
      },
      treeshake: {
        preset: 'recommended',
      },
    },
  },
}

/**
 * Strips CSS imports from JS chunks in the bundle output, but ONLY for CSS
 * files that were produced by the current build (e.g., by vanilla-extract).
 *
 * When building CDN bundles, CSS is served separately via `<link>` tags
 * (injected by the CLI's runtime script). The JS bundles should not contain
 * CSS import side-effects for these extracted CSS files, as the module server
 * serves JS and CSS as separate files.
 *
 * CSS imports from third-party packages that were bundled in (and whose CSS
 * was processed by Vite into the same output) are safe to strip too — their
 * styles end up in the combined CSS asset served via `<link>`. But imports
 * referencing CSS files NOT present in the bundle output are left untouched,
 * since stripping them could lose styles that aren't in our CSS output.
 */
export function stripCssImportsPlugin(): Plugin {
  return {
    name: 'sanity/strip-css-imports',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      // 1. Collect CSS asset filenames produced by this build
      //    (e.g., vanilla-extract output, Vite-processed CSS imports)
      const cssAssetNames = new Set<string>()
      for (const [fileName, entry] of Object.entries(bundle)) {
        if (entry.type === 'asset' && fileName.endsWith('.css')) {
          cssAssetNames.add(fileName)
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
