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
          assetInfo.names?.some((n) => n.endsWith('.css')) ? 'index.css' : '[name]-[hash][extname]',
      },
      treeshake: {
        preset: 'recommended',
      },
    },
  },
}

/**
 * Strips CSS imports from JS chunks in the bundle output.
 *
 * When building CDN bundles, CSS is served separately via `<link>` tags
 * (injected by the CLI's runtime script). The JS bundles should not contain
 * CSS import side-effects, as the module server only serves JS and CSS as
 * separate files — it does not resolve CSS imports from within JS modules.
 *
 * This plugin runs in the `generateBundle` hook and removes any
 * `import './foo.css'` or `import "foo.css"` statements from JS chunks.
 */
export function stripCssImportsPlugin(): Plugin {
  return {
    name: 'sanity/strip-css-imports',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      for (const [, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue

        // Remove CSS import statements from JS chunks
        // Matches: import './index.css', import "./style.css", import './foo-bar.css';
        chunk.code = chunk.code.replace(
          /import\s+['"][^'"]*\.css['"];?\n?/g,
          '/* css served separately via <link> tag */\n',
        )
      }
    },
  }
}
