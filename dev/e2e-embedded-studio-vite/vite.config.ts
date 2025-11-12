import {getViteAliases} from '@repo/dev-aliases/vite'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      ...getViteAliases(),
    },
  },
  define: {
    'import.meta.env.SANITY_E2E_PROJECT_ID': JSON.stringify(process.env.SANITY_E2E_PROJECT_ID),
    'import.meta.env.SANITY_E2E_DATASET': JSON.stringify(process.env.SANITY_E2E_DATASET),
  },
})
