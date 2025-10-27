import baseConfig from '@repo/eslint-config'
import studio from '@sanity/eslint-config-studio'
import {defineConfig} from 'eslint/config'

export default defineConfig([
  {
    ignores: ['builds/**/*', 'builds/**/assets/**/*', 'results/**/*'],
  },
  ...studio,
  ...baseConfig,
])
