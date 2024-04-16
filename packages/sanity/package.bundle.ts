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
        index: './src/_exports/index.ts',
        structure: './src/_exports/structure.ts',
        _singletons: './src/_exports/_singletons.ts',
        router: './src/_exports/router.ts',
        react: './node_modules/react/cjs/react.production.min.js',
        'styled-components': './node_modules/styled-components/dist/styled-components.esm.js',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'styled-components'],
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
