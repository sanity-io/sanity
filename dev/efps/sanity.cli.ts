import {defineCliConfig} from 'sanity/cli'

import {apiConfig} from './apiConfig'

export default defineCliConfig({
  api: apiConfig,
  // React Compiler on `oxc-transform-react` (no babel), see dev/test-studio/sanity.cli.ts
  reactCompiler: {transform: 'oxc', target: '19'},
})
