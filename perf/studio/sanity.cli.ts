import {defineCliConfig} from 'sanity/cli'
import {STUDIO_DATASET, STUDIO_PROJECT_ID} from '../config/constants'

export default defineCliConfig({
  api: {
    projectId: STUDIO_PROJECT_ID,
    dataset: STUDIO_DATASET,
  },
})
