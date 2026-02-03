import {defineConfig} from 'eslint/config'

import baseConfig from './index.js'

export default defineConfig([
  ...baseConfig,
  {
    rules: {
      // file endings required due to how the ESLint resolver works
      'import/extensions': 'off',
    },
  },
])
