import baseConfig from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...baseConfig,
  external: ['sanity'],
  babel: {reactCompiler: true, styledComponents: true},
  reactCompilerOptions: {target: '19'},
  rollup: {
    treeshake: {moduleSideEffects: true},
    output: {
      intro: (chunkInfo) => {
        if (chunkInfo.isEntry && chunkInfo.name === 'index') {
          return `import './bundle.css'`
        }

        return ''
      },
    },
    vanillaExtract: true,
  },
})
