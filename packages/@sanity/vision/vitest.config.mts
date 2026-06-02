import {defineConfig} from '@repo/test-config/vitest'
import babel from '@rolldown/plugin-babel'
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import viteReact, {reactCompilerPreset} from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  plugins: [
    vanillaExtractPlugin(),
    ...viteReact(),
    babel({presets: [reactCompilerPreset({target: '19'})]}),
  ],
})
