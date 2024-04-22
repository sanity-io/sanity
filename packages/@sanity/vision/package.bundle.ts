/* eslint-disable import/no-extraneous-dependencies */
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
        vision: './src/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'sanity', 'react/jsx-runtime', 'styled-components'],
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
