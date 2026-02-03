import baseConfig from './index.js'
import {defineConfig} from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  {
    rules: {
      // file endings required due to how the ESLint resolver works
      'import/extensions': 'off',
    },
  },
])
