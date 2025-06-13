import {defineConfig} from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['@sanity/functions', '@sanity/client'],
    },
  },
})
