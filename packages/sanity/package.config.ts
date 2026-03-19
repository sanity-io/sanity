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

  rollup: {
    // Workaround for a long-standing rollup bug: when `moduleSideEffects` marks externals as
    // side-effect-free (e.g. 'no-external') in a multi-entry build, bare imports from other entries
    // leak into the first entry. The default `true` avoids this. Since the output is a library, the
    // consumer's bundler handles external tree-shaking anyway.
    treeshake: {moduleSideEffects: true},

    // Passing `vanillaExtract: true` enables extract mode, which bundles all CSS into a single
    // `bundle.css` file but does NOT add CSS imports to the JS output — meaning consumers would
    // need to manually import the CSS file, and the Sanity CLI wouldn't pick it up automatically.
    //
    // By passing an options object (without `extract`), the plugin instead generates per-file
    // `.vanilla.css` companion files and adds `import` statements in the JS output that reference
    // them and they will be imported by the consumer automatically.
    vanillaExtract: {identifiers: 'short'},
  },
})
