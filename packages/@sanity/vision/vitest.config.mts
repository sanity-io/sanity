import {defineConfig} from '@repo/test-config/vitest'
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  plugins: [
    vanillaExtractPlugin(),
    react({babel: {plugins: [['babel-plugin-react-compiler', {target: '19'}]]}}),
  ],
})
