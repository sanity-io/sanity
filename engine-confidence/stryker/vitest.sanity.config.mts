import path from 'node:path'

import baseConfig from '../../packages/sanity/vitest.config.mts'

const packageDirectory = path.resolve(import.meta.dirname, '../../packages/sanity')

export default {
  ...baseConfig,
  root: packageDirectory,
  test: {
    ...baseConfig.test,
    include: [
      'src/core/store/document/**/*.test.{ts,tsx}',
      'src/core/form/patch/**/*.test.{ts,tsx}',
      'src/core/form/utils/**/*.test.{ts,tsx}',
    ],
    exclude: [...(baseConfig.test?.exclude ?? []), '.stryker-tmp/**'],
    typecheck: {...baseConfig.test?.typecheck, enabled: false},
  },
}
