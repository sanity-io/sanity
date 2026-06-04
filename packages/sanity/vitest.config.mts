import {defineConfig} from '@repo/test-config/vitest'
import babel from '@rolldown/plugin-babel'
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import viteReact, {reactCompilerPreset} from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globalSetup: ['./test/setup/global.ts'],
    setupFiles: ['./test/setup/environment.ts'],
    exclude: ['./playwright-ct', './src/_internal/cli'],
    server: {
      deps: {inline: ['vitest-package-exports']},
    },
    typecheck: {
      enabled: true,
      // @TODO we have a lot of TS errors to fix in test files before we can remove this line
      ignoreSourceErrors: true,
    },
  },
  plugins: [
    vanillaExtractPlugin(),
    ...viteReact(),
    babel({presets: [reactCompilerPreset({target: '19'})]}),
  ],
})
