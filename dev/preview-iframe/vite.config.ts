import viteReact from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [viteReact()],
  server: {
    port: 3334,
    strictPort: true,
  },
  preview: {
    port: 3334,
    strictPort: true,
  },
})
