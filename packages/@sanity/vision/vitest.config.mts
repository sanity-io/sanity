import {defineConfig} from '@repo/test-config/vitest'
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  plugins: [
    vanillaExtractPlugin(),
    viteReact({babel: {plugins: [['babel-plugin-react-compiler', {target: '19'}]]}}),
  ],
})
