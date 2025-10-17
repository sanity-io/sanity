import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import baseConfig from '@repo/eslint-config'
import studio from '@sanity/eslint-config-studio'
import {defineConfig} from 'eslint/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_PATH = resolve(__dirname, '../..')

export default defineConfig([
  {
    ignores: ['builds/**/*', 'builds/**/assets/**/*', 'results/**/*'],
  },
  ...studio,
  ...baseConfig,
  {
    rules: {
      'import/no-extraneous-dependencies': ['error', {packageDir: [ROOT_PATH, __dirname]}],
    },
  },
])
