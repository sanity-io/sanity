// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unassigned-import
import '@vitest/coverage-v8'

import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json', 'json-summary'],
      include: ['**/packages/**/src/**'],
      reportOnFailure: true,
      clean: true,
    },
  },
})
