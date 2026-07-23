import {defineConfig} from '@repo/test-config/vitest'
import babel from '@rolldown/plugin-babel'
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import viteReact, {reactCompilerPreset} from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // styled-components turns off its fast CSSOM injection path ("speedy"
    // mode) whenever NODE_ENV !== 'production' and appends CSS text nodes to
    // <style> tags instead. jsdom reparses the whole stylesheet on every such
    // insertion, which slows first mounts of styled-heavy trees down enough to
    // trip default testing-library timeouts. Force the production injection
    // path, which is also what the @sanity/styled-components fork always used.
    env: {SC_DISABLE_SPEEDY: 'false'},
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
