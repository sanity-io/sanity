import viteReact from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  base: '/js-lite/',
  // React Compiler through `oxc-transform-react` (no babel), same as packages/sanity
  plugins: [viteReact({compiler: {target: '19'}})],
  server: {
    port: 3335,
    strictPort: true,
  },
  preview: {
    port: 3335,
    strictPort: true,
  },
})
