import {defineConfig} from '@repo/test-config/vitest'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
  // React Compiler through `oxc-transform-react` (no babel), same as packages/sanity
  plugins: [viteReact({compiler: {target: '19'}})],
})
