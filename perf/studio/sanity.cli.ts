import {defineCliConfig} from 'sanity/cli'

import {STUDIO_DATASET, STUDIO_PROJECT_ID} from '../tests/config/constants'

export default defineCliConfig({
  api: {
    projectId: STUDIO_PROJECT_ID,
    dataset: STUDIO_DATASET,
  },
  // React Compiler on `oxc-transform-react` (no babel), see dev/test-studio/sanity.cli.ts
  reactCompiler: {transform: 'oxc', target: '19'},
})
