import {defineConfig} from '@repo/test-config/vitest'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
