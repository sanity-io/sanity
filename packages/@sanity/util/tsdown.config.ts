import {defineConfig} from '@repo/package.config'

export default await Promise.all([
  defineConfig({
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
  }),
  // `./createSafeJsonParser` is also published as CJS (see the `require` condition in
  // `package.json`) for `require()` consumers
  defineConfig({
    entry: {createSafeJsonParser: './src/_exports/createSafeJsonParser.ts'},
    format: 'cjs',
  }),
])
