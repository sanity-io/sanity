import {defineConfig} from '@repo/tsdown.config'

// The `exports` maps in `package.json` are maintained by hand for this package: generation would
// need the ESM and CJS configs merged into one, and with the CJS build containing a single entry
// tsdown treats that entry as the root `.` export (its per-format single-entry heuristic), which
// would wire `require` for `.` to `createSafeJsonParser.cjs`.
//
// Also wipe legacy root-level entry artifacts from older pkg-utils layouts (a string[] replaces
// the shared `clean: ['lib']` default, so `lib` must be listed explicitly)
const clean = [
  'lib',
  'client.js',
  'concurrency-limiter.js',
  'content.js',
  'createSafeJsonParser.js',
  'fs.js',
  'legacyDateFormat.js',
  'paths.js',
]

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
    clean,
    exports: false,
  }),
  // `./createSafeJsonParser` is also published as CJS (see the `require` condition in
  // `package.json`) for `require()` consumers
  defineConfig({
    entry: {createSafeJsonParser: './src/_exports/createSafeJsonParser.ts'},
    format: 'cjs',
    clean,
    exports: false,
  }),
])
