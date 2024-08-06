import baseConfig from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...baseConfig,
  legacyExports: false,
  bundles: [
    {source: './src/_exports.cts.ts', require: './lib/groq.cjs'},
    {source: './src/_exports.mts.ts', import: './lib/groq.js'},
  ],
})
