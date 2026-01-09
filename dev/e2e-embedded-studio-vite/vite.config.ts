import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [
    react({babel: {plugins: ['babel-plugin-react-compiler'], generatorOpts: {compact: true}}}),
  ],
  // Needed due to the monorepo setup, optimizeDeps will cause duplication of context providers when it chunks lazy imports so we have to disable optimization
  optimizeDeps: {exclude: ['sanity']},
  resolve: {dedupe: ['react', 'react-dom', 'sanity', 'styled-components']},
  define: {
    'import.meta.env.SANITY_E2E_PROJECT_ID': JSON.stringify(process.env.SANITY_E2E_PROJECT_ID),
    'import.meta.env.SANITY_E2E_DATASET': JSON.stringify(process.env.SANITY_E2E_DATASET),
  },
})
