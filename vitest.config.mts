// oxlint-disable-next-line import/no-unassigned-import
import '@vitest/coverage-v8'

import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    // Disable console interception to prevent `EnvironmentTeardownError: Closing rpc while
    // "onUserConsoleLog" was pending` when async emissions (e.g. RxJS catchError logs) fire
    // after a test's body resolves but before the worker finishes teardown.
    // Tradeoff: console.log output from tests goes directly to stdout/stderr instead of
    // through the vitest reporter, but reliability beats tidy output here.
    disableConsoleIntercept: true,
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
      'perf/tests',
      'packages/@repo/release-notes',
      'packages/@repo/bundle-manager',
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
