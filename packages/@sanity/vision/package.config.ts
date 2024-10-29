import baseConfig from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...baseConfig,
  external: ['sanity'],
  babel: {reactCompiler: true},
  reactCompilerOptions: {target: '18'},
})
