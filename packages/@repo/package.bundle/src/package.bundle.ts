import react from '@vitejs/plugin-react'
import {type UserConfig} from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import {version} from '../package.json'

export const defaultConfig: UserConfig = {
  appType: 'custom',
  define: {
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
      external: ['react', /^react-dom/, 'react/jsx-runtime', 'styled-components'],
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
}
