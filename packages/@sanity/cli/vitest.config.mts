import {defineConfig} from '@repo/test-config/vitest'
// needed for globalSetup
import dotenv from 'dotenv'

dotenv.config({
  path: [`${__dirname}/../../../.env.local`, `${__dirname}/../../../.env`],
})

export default defineConfig({
  test: {
    includeSource: ['./test/**/*.ts', './src/**/__tests__/**/*.ts'],
    globalSetup: ['./test/shared/globalSetup.ts'],
    testTimeout: 30000, // 30s
  },
  define: {
    __DEV__: JSON.stringify(true),
  },
})
