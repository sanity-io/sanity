import baseConfig from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...baseConfig,

  extract: {
    ...baseConfig.extract,
    rules: {
      ...baseConfig.extract.rules,
      'ae-incompatible-release-tags': 'error',
      'ae-missing-release-tag': 'error',
    },
  },

  babel: {reactCompiler: true, styledComponents: true},
  reactCompilerOptions: {target: '19'},

  strictOptions: {
    ...baseConfig.strictOptions,
    // pkg-utils injects an `import 'sanity/bundle.css'` side effect into the entry, so this package
    // is not side-effect-free. Omitting `sideEffects` (treated as "everything has side effects")
    // is the correct declaration here and keeps the css import from being tree-shaken away, so
    // allow it rather than requiring an explicit `sideEffects` field.
    noImplicitSideEffects: 'off',
  },

  // Workaround for a long-standing rollup bug: when `moduleSideEffects` marks externals as
  // side-effect-free (e.g. 'no-external') in a multi-entry build, bare imports from other entries
  // leak into the first entry. The default `true` avoids this. Since the output is a library, the
  // consumer's bundler handles external tree-shaking anyway.
  rollup: {
    treeshake: {moduleSideEffects: true},
    vanillaExtract: true,
  },
})
