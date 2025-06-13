import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  {
    name: 'root/scripts',
    files: ['scripts/**/*'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'import/no-dynamic-require': 'off',
      'no-console': 'off',
      'no-sync': 'off',
      'no-process-exit': 'off',
    },
  },
])
