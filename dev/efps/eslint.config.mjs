import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'

export default defineConfig([
  {
    ignores: ['builds/**/*', 'builds/**/assets/**/*', 'results/**/*'],
  },
  ...baseConfig,
])
