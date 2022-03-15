/* eslint-disable no-process-env, no-sync */

import path from 'path'
import {esbuildCommonjs, viteCommonjs} from '@originjs/vite-plugin-commonjs'
import viteReact from '@vitejs/plugin-react'
import {defineConfig} from 'vite'
import {viteCanonicalModules} from './_vite/canonical-modules'

const cwd = __dirname
const SRC_PATH = path.resolve(__dirname, 'src')
const MONOREPO_PATH = path.resolve(__dirname, '../..')

export const DEFAULT_CANONICAL_MODULES = [
  'react',
  'react/jsx-dev-runtime',
  'react-dom',
  'styled-components',
]

export const DEFAULT_COMMONJS_MODULES = ['@sanity/client', '@sanity/eventsource']

function loadMonorepoAliases() {
  // eslint-disable-next-line import/no-dynamic-require
  const aliases: Record<string, string> = require(path.resolve(MONOREPO_PATH, 'dev/aliases'))

  return Object.entries(aliases).map(([key, relativePath]) => ({
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

      include: [
        /node_modules/,
        ...DEFAULT_COMMONJS_MODULES.map((id) => {
          return new RegExp(`${id.replace(/\//g, '\\/')}`)
        }),
      ],
    },
    sourcemap: true,
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [esbuildCommonjs(DEFAULT_COMMONJS_MODULES)],
    },
    include: DEFAULT_COMMONJS_MODULES,
  },
  plugins: [
    viteReact(),

    viteCanonicalModules({
      ids: DEFAULT_CANONICAL_MODULES,
      cwd,
    }),

    viteCommonjs({
      include: DEFAULT_COMMONJS_MODULES,
    }),
  ],
  resolve: {
    alias: [...monorepoAliases],
  },
  root: SRC_PATH,
  server: {
    fs: {strict: false},
    host: '0.0.0.0',
    port: 3000,
  },
})
