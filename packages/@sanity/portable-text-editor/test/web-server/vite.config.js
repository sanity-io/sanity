import path from 'path'
import {defineConfig} from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  // define: {
  //   __DEV__: true,
  // },
  build: {
    minify: false,
  },
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@sanity/schema': path.join(__dirname, '../../../schema/src/legacy/Schema.ts'),
      '@sanity/util/content': path.join(__dirname, '../../../util/src/contentUtils/index.ts'),
      '@sanity/types': path.join(__dirname, '../../../types/src/index.ts'),
      '@sanity/block-tools': path.join(__dirname, '../../../block-tools/src/index.ts'),
      '@sanity/portable-text-editor': path.join(__dirname, '../../src/index.ts'),
    },
  },
})
