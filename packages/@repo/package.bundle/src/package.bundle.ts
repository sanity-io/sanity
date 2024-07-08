import react from '@vitejs/plugin-react'
import {escapeRegExp} from 'lodash'
import {type UserConfig} from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import {version} from '../package.json'

export const defaultConfig: UserConfig = {
  appType: 'custom',
  define: {
    '__DEV__': 'false',
    'process.env.PKG_VERSION': JSON.stringify(version),
    'process.env.NODE_ENV': '"production"',
    'process.env': {},
  },
  plugins: [react(), tsconfigPaths()],
  build: {
    emptyOutDir: true,
    lib: {
      entry: {},
      formats: ['es'],
    },
    rollupOptions: {
      // self-externals are required here in order to ensure that the presentation
      // tool and future transitive dependencies that require sanity do not
      // re-include sanity in their bundle
      external: [
        ...['react', 'react-dom', 'styled-components', 'sanity', '@sanity/vision'].flatMap(
          (dependency) => [
            dependency,
            // this matches `react/jsx-runtime`, `sanity/presentation` etc
            new RegExp(`^${escapeRegExp(dependency)}\\/`),
          ],
        ),
        './checkoutPairWorker.ts',
      ],
      output: {
        exports: 'named',
        dir: 'dist',
        format: 'es',
      },
      treeshake: {
        preset: 'recommended',
      },
    },
  },
  worker: {
    format: 'es',
  },
}
