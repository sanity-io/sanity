// oxlint-disable-next-line import/no-unassigned-import
import '@vitest/coverage-v8'

import {defineConfig} from 'vitest/config'

// Node 25+ enables the Web Storage API by default, shadowing the `localStorage`
// global provided by jsdom (vitest's `populateGlobal` skips keys that already
// exist on the worker's global). Disable Node's native Web Storage so jsdom's
// implementation is used. The flag is a no-op on Node versions where Web
// Storage isn't enabled. See https://github.com/vitest-dev/vitest/issues/8757.
// Use the canonical `--no-experimental-webstorage` alias since the shorter
// `--no-webstorage` only exists on Node 26+.
const workerExecArgv = ['--no-experimental-webstorage']

export default defineConfig({
  test: {
    execArgv: workerExecArgv,
    forceRerunTriggers: [
      '**/package.json/**',
      '**/vitest.config.*/**',
      '**/vite.config.*/**',
      '**/pnpm-workspace.yaml',
      '**/pnpm-lock.yaml',
      '**/turbo.json',
      '**/.github/workflows/test.yml',
    ],
    projects: [
      'packages/@sanity/mutator',
      'packages/@sanity/schema',
      'packages/@sanity/types',
      'packages/@sanity/util',
      'packages/@sanity/vision',
      'packages/sanity',
      // NOTE: the browser-mode project (packages/sanity/vitest.browser.config.mts)
      // is intentionally NOT registered here. It runs in a real browser via
      // `pnpm --filter sanity test:browser` (see .github/workflows/browser-tests.yml).
      // Including it in the default multi-project run makes the regular (forks
      // pool) test run try to execute *.browser.test.* files, which fails with
      // "vitest/browser can be imported only inside the Browser Mode".
      'perf/tests',
      'packages/@repo/release-notes',
      'packages/@repo/bundle-manager',
      'packages/@repo/package.bundle',
      'packages/@repo/utils',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json', 'json-summary'],
      include: ['packages/**/src/**'],
      exclude: [
        // exclude telemetry definitions
        '**/__telemetry__/**',
        // exclude internal
        'packages/@repo/**',
        // exclude non-source files that the v8 coverage provider can't parse
        '**/*.md',
      ],
      reportOnFailure: true,
      clean: true,
    },
    typecheck: {
      enabled: true,
      // @TODO we have a lot of TS errors to fix in test files before we can remove this line
      ignoreSourceErrors: true,
    },
  },
})
