import {defineConfig} from '@repo/test-config/vitest'
import babel from '@rolldown/plugin-babel'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import viteReact, {reactCompilerPreset} from '@vitejs/plugin-react'

// The vanilla-extract plugin is still required in jsdom: `.css.ts` modules need its transform
// for file scoping (they throw "Styles were unable to be assigned to a file" without it). Style
// *injection* is skipped via `disableRuntimeStyles` in `test/setup/environment.ts`, since no
// jsdom test asserts on styles or vanilla-extract class names.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globalSetup: ['./test/setup/global.ts'],
    setupFiles: ['./test/setup/environment.ts'],
    exclude: ['./src/_internal/cli', '**/*.browser.test.*'],
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
