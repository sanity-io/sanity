import {defineConfig} from '@repo/tsdown.config'

export default defineConfig({
  entry: {
    'index': './src/_exports/index.ts',
    'fs': './src/_exports/fs.ts',
    'client': './src/_exports/client.ts',
    'concurrency-limiter': './src/_exports/concurrency-limiter.ts',
    'content': './src/_exports/content.ts',
    'createSafeJsonParser': './src/_exports/createSafeJsonParser.ts',
    'legacyDateFormat': './src/_exports/legacyDateFormat.ts',
    'paths': './src/_exports/paths.ts',
  },
  // Also wipe legacy root-level entry artifacts from older pkg-utils layouts (a string[] replaces
  // the shared `clean: ['lib']` default, so `lib` must be listed explicitly)
  clean: [
    'lib',
    'client.js',
    'concurrency-limiter.js',
    'content.js',
    'createSafeJsonParser.js',
    'fs.js',
    'legacyDateFormat.js',
    'paths.js',
  ],
})
