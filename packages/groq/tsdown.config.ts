import {defineConfig} from '@repo/tsdown.config'

// The `exports` map in `package.json` is maintained by hand for this package: the ESM and CJS
// bundles are built from different source files, so generation can't express it (the `monorepo`
// dev condition would point at whichever source file happens to be processed first).
export default await Promise.all([
  defineConfig({
    entry: {groq: './src/_exports.mts.ts'},
    exports: false,
  }),
  // The CJS bundle has its own source file that assigns `module.exports` directly, so that
  // `require('groq')` returns the tagged template function itself
  defineConfig({
    entry: {groq: './src/_exports.cts.ts'},
    format: 'cjs',
    // `lib/groq.d.ts` from the ESM build covers both formats (the package publishes a single
    // `types` entry), so skip the `.d.cts` output
    dts: false,
    exports: false,
  }),
])
