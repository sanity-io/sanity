import {defineConfig} from '@repo/tsdown.config'

export default defineConfig({
  entry: './src/index.ts',
  // React Compiler on oxc-transform-react (the native Rust port), see packages/sanity/tsdown.config.ts
  reactCompiler: {transform: 'oxc', target: '19'},
})
