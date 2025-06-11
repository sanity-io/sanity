import {defineConfig} from 'eslint/config'

import baseConfig from './index.js'

export default defineConfig([
  ...baseConfig,
  {
    rules: {
      // not needed as we have hoisting for eslint plugins enabled
      'import/no-extraneous-dependencies': 'off',
      // file endings required due to how the ESLint resolver works
      'import/extensions': 'off',
    },
  },
])
