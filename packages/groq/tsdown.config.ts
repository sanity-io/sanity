import {defineConfig} from '@repo/package.config'

export default await Promise.all([
  defineConfig({
    entry: {groq: './src/_exports.mts.ts'},
  }),
  // The CJS bundle has its own source file that assigns `module.exports` directly, so that
  // `require('groq')` returns the tagged template function itself
  defineConfig({
    entry: {groq: './src/_exports.cts.ts'},
    format: 'cjs',
    // `lib/groq.d.ts` from the ESM build covers both formats (the package publishes a single
    // `types` entry), so skip the `.d.cts` output
    dts: false,
  }),
])
