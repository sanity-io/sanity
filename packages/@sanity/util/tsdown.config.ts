import {defineConfig} from '@repo/tsdown.config'

export default defineConfig({
  // Filenames under `_exports/` map 1:1 to export names (index, fs, client, …)
  entry: './src/_exports/*.ts',
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
