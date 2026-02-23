// oxlint-disable-next-line import/no-unassigned-import
import '@vitest/coverage-v8'

import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
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
      'packages/@sanity/cli',
      'packages/@sanity/mutator',
      'packages/@sanity/schema',
      'packages/@sanity/types',
      'packages/@sanity/util',
      'packages/@sanity/vision',
      'packages/sanity',
      'packages/sanity/src/_internal/cli',
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
        // exclude cli source files since their tests run in separate processes, so no coverage will be collected
        'packages/@sanity/cli/src/**',
        'packages/sanity/src/_internal/cli/**',
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
