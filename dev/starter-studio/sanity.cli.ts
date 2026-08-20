import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'test',
  },
  // React Compiler on `oxc-transform-react` (no babel), see dev/test-studio/sanity.cli.ts
  reactCompiler: {transform: 'oxc', target: '19'},
})
