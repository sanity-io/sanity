import path from 'path'
import {defineConfig} from 'vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [viteReact()],
  define: {
    __DEV__: true,
  },
  resolve: {
    alias: {
      '@sanity/state-router': path.join(__dirname, '../src'),
    },
  },
})
