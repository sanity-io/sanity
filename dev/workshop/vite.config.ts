/* eslint-disable no-process-env, no-sync */

import path from 'path'
import {viteCommonjs, esbuildCommonjs} from '@originjs/vite-plugin-commonjs'
import reactRefresh from '@vitejs/plugin-react-refresh'
import {defineConfig} from 'vite'
import {pluginCanonicalModules} from './vite/plugin-canonical-modules'
import {pluginLegacyParts} from './vite/plugin-legacy-parts'
import {pluginWorkshopScopes} from './vite/plugin-workshop-scopes'
import {createPartsResolver} from './__legacy/partsResolver'
import parts from './__legacy/parts'

const SRC_PATH = path.resolve(__dirname, 'src')
const MONOREPO_PATH = path.resolve(__dirname, '../..')

const partsResolver = createPartsResolver()

const cssPartAliases = Object.entries(parts.implementations)
  .filter(
    ([, implementations]: any) =>
      implementations.length > 0 && implementations[0].path.endsWith('.css')
  )
  .map(([key, implementations]: any) => {
    return {
      find: key,
      replacement: implementations[0].path,
    }
  })

function loadMonorepoAliases() {
  // eslint-disable-next-line import/no-dynamic-require
  const aliases = require(path.resolve(MONOREPO_PATH, '.module-aliases'))

  return Object.entries(aliases)
    .filter(([key]) => key != '@sanity/client')
    .map(([key, relativePath]: any) => ({
      find: key,
      replacement: path.resolve(MONOREPO_PATH, relativePath),
    }))
}

const monorepoAliases = loadMonorepoAliases()

export default defineConfig({
  build: {
    // minify: false,
    outDir: path.resolve(__dirname, 'public'),
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
        frame: path.resolve(__dirname, 'src/frame/index.html'),
      },
    },
    // - vite uses rollup to bundle the built version of the workshop
    // - vite also includes the commonjs plugin by default in order to transform
    //   the commonjs module in `node_modules`
    // - these options here are forwarded directly to the commonjs rollup plugin
    //   and includes overrides that make the commonjs plugin run outside of
    //   `node_modules` and for typescript files as well
    //
    // see here:
    // https://github.com/vitejs/vite/blob/aab303f7bd333307c77363259f97a310762c4848/packages/vite/src/node/build.ts#L265-L269
    commonjsOptions: {
      transformMixedEsModules: true,
      extensions: ['.js', '.cjs', '.ts', '.tsx'],
      // this include is empty to override the default `include`
      include: [],
      // https://github.com/rollup/plugins/tree/master/packages/commonjs/#dynamicrequiretargets
      dynamicRequireTargets: ['part:@sanity/base/util/document-action-utils'],
    },
    sourcemap: true,
  },

  define: {
    // __DEV__: JSON.stringify(true),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    include: ['@sanity/form-builder'],
    esbuildOptions: {
      plugins: [esbuildCommonjs(['@sanity/form-builder'])],
    },
  },
  plugins: [
    reactRefresh(),
    pluginLegacyParts(partsResolver),
    pluginCanonicalModules(['@sanity/ui', 'react', 'react-dom', 'styled-components']),
    pluginWorkshopScopes(),
    viteCommonjs({
      include: ['@sanity/eventsource', '@sanity/structure', '@sanity/form-builder'],
    }),
  ],
  resolve: {
    alias: [
      {
        find: '@sanity/base/lib',
        replacement: path.resolve(MONOREPO_PATH, 'packages/@sanity/base/src'),
      },

      ...monorepoAliases,
      ...cssPartAliases,

      // NOTE: this is a workaround since Vite doesn't do CJS exports
      {
        find: '@sanity/client',
        replacement: path.resolve(__dirname, 'mocks/@sanity/client.ts'),
      },
      {
        find: '@sanity/generate-help-url',
        replacement: path.resolve(__dirname, 'mocks/@sanity/generate-help-url.ts'),
      },
      {
        find: 'part:@sanity/base/client',
        replacement: path.resolve(MONOREPO_PATH, 'packages/@sanity/base/src/client/index.esm.ts'),
      },
    ],
  },
  root: SRC_PATH,
  server: {
    fs: {strict: false},
    host: '0.0.0.0',
    port: 9009,
  },
})
