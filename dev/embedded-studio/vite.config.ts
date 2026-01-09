import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({babel: {plugins: ['babel-plugin-react-compiler'], generatorOpts: {compact: true}}}),
  ],
  // Needed due to the monorepo setup, optimizeDeps will cause duplication of context providers when it chunks lazy imports so we have to disable optimization
  optimizeDeps: {exclude: ['sanity']},
  resolve: {dedupe: ['react', 'react-dom', 'sanity', 'styled-components']},
})
