import {STUDIO_DATASET, STUDIO_PROJECT_ID} from '../tests/config/constants'
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: STUDIO_PROJECT_ID,
    dataset: STUDIO_DATASET,
  },
  reactCompiler: {target: '19'},
})
