import baseConfig from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...baseConfig,
  external: ['sanity'],
  babel: {reactCompiler: true},
  reactCompilerOptions: {target: '18'},
  // oxc powered dts generation, requires --isolatedDeclarations support
  dts: 'rolldown',
  tsconfig: 'tsconfig.rolldown.json',
})
