import path from 'node:path'

import viteReact from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [viteReact()],
  build: {
    minify: false,
  },
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@sanity/schema': path.join(__dirname, '../../../schema/src/legacy/Schema.ts'),
      '@sanity/util/content': path.join(__dirname, '../../../util/src/content/index.ts'),
      '@sanity/types': path.join(__dirname, '../../../types/src/index.ts'),
      '@sanity/block-tools': path.join(__dirname, '../../../block-tools/src/index.ts'),
      '@sanity/portable-text-editor': path.join(__dirname, '../../src/index.ts'),
    },
  },
})
