import path from 'path'
import {defineConfig} from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  define: {
    __DEV__: true,
  },
  resolve: {
    alias: {
      '@sanity/state-router': path.join(__dirname, '../src/index.ts'),
      '@sanity/state-router/components': path.join(__dirname, '../src/components'),
    },
  },
})
