import react from '@vitejs/plugin-react'
import {escapeRegExp} from 'lodash-es'
import {type UserConfig} from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import {version} from '../package.json'

export const defaultConfig: UserConfig = {
  appType: 'custom',
  define: {
    '__SANITY_STAGING__': process.env.SANITY_INTERNAL_ENV === 'staging',
    'process.env.PKG_VERSION': JSON.stringify(version),
    'process.env.NODE_ENV': '"production"',
    'process.env': {},
  },
  plugins: [
    react({
      babel: {plugins: [['babel-plugin-react-compiler', {target: '18'}]]},
    }),
    tsconfigPaths(),
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
      },
      treeshake: {
        preset: 'recommended',
      },
    },
  },
}
