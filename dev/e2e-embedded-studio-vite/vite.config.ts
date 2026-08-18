import viteReact from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [viteReact()],
  define: {
    'import.meta.env.SANITY_E2E_PROJECT_ID': JSON.stringify(process.env.SANITY_E2E_PROJECT_ID),
    'import.meta.env.SANITY_E2E_DATASET': JSON.stringify(process.env.SANITY_E2E_DATASET),
  },
})
