import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_PATH = resolve(__dirname, '../../..')

export default defineConfig(baseConfig)
