import baseConfig from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...baseConfig,
  extract: {enabled: false},
  // dts: 'api-extractor'
})
