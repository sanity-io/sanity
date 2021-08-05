import {defineConfig} from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  optimizeDeps: {
    include: ['@sanity/generate-help-url', '@sanity/schema'],
  },
  define: {
    __DEV__: true,
  },
})
