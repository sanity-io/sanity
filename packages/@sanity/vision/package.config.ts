import baseConfig from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...baseConfig,
  external: ['sanity'],
  babel: {reactCompiler: true, styledComponents: true},
  reactCompilerOptions: {target: '19'},
  strictOptions: {
    ...baseConfig.strictOptions,
    // pkg-utils injects an `import './bundle.css'` side effect into the entry, so this package
    // is not side-effect-free. Omitting `sideEffects` (treated as "everything has side effects")
    // is the correct declaration here and keeps the css import from being tree-shaken away, so
    // allow it rather than requiring an explicit `sideEffects` field.
    noImplicitSideEffects: 'off',
  },
  rollup: {
    treeshake: {moduleSideEffects: true},
    vanillaExtract: true,
  },
})
