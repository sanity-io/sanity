import {pandacss} from '@pandacss/vite'
import {defineConfig} from '@repo/test-config/vitest'
import viteReact from '@vitejs/plugin-react'

/** Slow fuzz tests. Left out here and run with `vitest.fuzz.config.mts` instead. */
export const FUZZ_TESTS = '**/*.fuzz.test.*'

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
    exclude: ['./src/_internal/cli', '**/*.browser.test.*', FUZZ_TESTS],
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
    // Rewrites the `css()` calls of the Panda CSS `.css.ts` modules to the class names the
    // package build ships (`transform`), so the source under test imports nothing from the
    // generated `styled-system` runtime. No stylesheet is loaded in jsdom: no jsdom test asserts
    // on computed styles or class names. `cwd` is explicit because the root `pnpm test` runs this
    // project from the repository root.
    pandacss({cwd: import.meta.dirname, transform: true}),
    // `compiler` runs React Compiler through `oxc-transform-react`, in the same native pass
    // as the TypeScript/JSX transform (no babel in the pipeline)
    ...viteReact({compiler: {target: '19'}}),
  ],
})
