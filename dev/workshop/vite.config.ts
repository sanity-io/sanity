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
const CANONICAL_MODULES = ['@sanity/ui', 'styled-components', 'react', 'react-dom']

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

  return Object.entries(aliases).map(([key, relativePath]: any) => ({
    find: key,
    replacement: path.resolve(MONOREPO_PATH, relativePath),
  }))
}

const monorepoAliases = loadMonorepoAliases()

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, 'public'),
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
        frame: path.resolve(__dirname, 'src/frame/index.html'),
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  plugins: [
    reactRefresh(),
    pluginLegacyParts(partsResolver),
    pluginCanonicalModules(CANONICAL_MODULES),
    pluginWorkshopScopes(),
    viteCommonjs({include: ['@sanity/client', '@sanity/eventsource', '@sanity/generate-help-url']}),
  ],
  resolve: {
    alias: [...monorepoAliases, ...cssPartAliases],
  },
  root: SRC_PATH,
  server: {
    fs: {strict: false},
    port: 9009,
  },
})
