import {defineConfig} from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './src/_exports/index.ts',
        structure: './src/_exports/structure.ts',
        router: './src/_exports/router.ts',
        react: './node_modules/react/index.js',
        'styled-components': './node_modules/styled-components/dist/styled-components.esm.js',
      },
    },
    rollupOptions: {
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
