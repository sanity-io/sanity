import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env': {},
  },
  plugins: [react()],
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        '_singletons': './src/_exports/_singletons.ts',
        'index': './src/_exports/index.ts',
        'desk': './src/_exports/desk.ts',
        'presentation': './src/_exports/presentation.ts',
        'react': './node_modules/react/cjs/react.production.min.js',
        'react_jsx-runtime': './node_modules/react/cjs/react-jsx-runtime.production.min.js',
        'router': './src/_exports/router.ts',
        'styled-components': './node_modules/styled-components/dist/styled-components.esm.js',
        'structure': './src/_exports/structure.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'styled-components'],
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
})
