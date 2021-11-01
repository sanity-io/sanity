/* eslint-disable no-process-env, no-sync */

import path from 'path'
import {viteCommonjs} from '@originjs/vite-plugin-commonjs'
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
    // sourcemap: true,
  },
  define: {
    // __DEV__: JSON.stringify(true),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  plugins: [
    reactRefresh(),
    pluginLegacyParts(partsResolver),
    pluginCanonicalModules(['@sanity/ui', 'react', 'react-dom', 'styled-components']),
    pluginWorkshopScopes(),
    viteCommonjs({
      include: ['@sanity/eventsource'],
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
    port: 9009,
  },
})
