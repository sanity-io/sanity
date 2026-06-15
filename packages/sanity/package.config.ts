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

  // Workaround for a long-standing rollup bug: when `moduleSideEffects` marks externals as
  // side-effect-free (e.g. 'no-external') in a multi-entry build, bare imports from other entries
  // leak into the first entry. The default `true` avoids this. Since the output is a library, the
  // consumer's bundler handles external tree-shaking anyway.
  rollup: {
    treeshake: {moduleSideEffects: true},
    output: {
      intro: (chunkInfo) => {
        /**
         * TODO: we are avoiding importing the bundle.css file here because it's producing
         * errors when using `sanity` with node or for server rendering:
         * `Error: Unknown file extension ".css"`
         */
        // if (chunkInfo.isEntry && chunkInfo.name === 'index') {
        //   return `import './bundle.css'`
        // }
        return ''
      },
    },
    vanillaExtract: true,
  },
})
