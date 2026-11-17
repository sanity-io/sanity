import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    name: '@sanity/validation',
    env: {TZ: 'America/Los_Angeles'},
  },
})
