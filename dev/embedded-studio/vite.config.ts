import {getViteAliases} from '@repo/dev-aliases/vite'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      ...getViteAliases(),
    },
  },
})
