// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unassigned-import
import '@vitest/coverage-v8'

import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'vmForks',
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json', 'json-summary'],
      include: ['packages/**/src/**'],
      exclude: [
        // exclude workshop files
        '**/__workshop__/**',
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
  },
})
