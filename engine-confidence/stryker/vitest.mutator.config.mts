import path from 'node:path'

import baseConfig from '../../packages/@sanity/mutator/vitest.config.mts'

const packageDirectory = path.resolve(import.meta.dirname, '../../packages/@sanity/mutator')

export default {
  ...baseConfig,
  root: packageDirectory,
  test: {
    ...baseConfig.test,
    include: ['test/**/*.test.ts'],
    exclude: [...(baseConfig.test?.exclude ?? []), '.stryker-tmp/**'],
    typecheck: {...baseConfig.test?.typecheck, enabled: false},
  },
}
