import viteReact from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  // React Compiler through `oxc-transform-react` (no babel), same as packages/sanity
  plugins: [viteReact({compiler: {target: '19'}})],
  // This app's env vars use a `SANITY_` prefix (not Vite's default `VITE_`),
  // so they need to be explicitly allowed through to `import.meta.env`.
  envPrefix: 'SANITY_',
  server: {
    port: 3335,
    strictPort: true,
  },
  preview: {
    port: 3335,
    strictPort: true,
  },
})
