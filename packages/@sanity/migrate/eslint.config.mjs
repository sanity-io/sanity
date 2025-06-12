import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_PATH = resolve(__dirname, '../../..')

export default defineConfig([
  ...baseConfig,
  {
    name: '@sanity/codegen/overrides',
    rules: {
      'import/no-extraneous-dependencies': ['error', {packageDir: [ROOT_PATH, __dirname]}],
      // These rules should be enabled in the future, they are disabled for now to reduce the PR scope for landing oxlint
      '@typescript-eslint/no-require-imports': 'off',
      'no-param-reassign': 'off',
    },
  },
])
