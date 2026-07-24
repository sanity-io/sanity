import {defineCliConfig} from 'sanity/cli'

const projectId = import.meta.env.SANITY_E2E_PROJECT_ID
const dataset = import.meta.env.SANITY_E2E_DATASET
if (!projectId || !dataset) {
  throw new Error('SANITY_E2E_PROJECT_ID and SANITY_E2E_DATASET must be set')
}

export default defineCliConfig({
  api: {
    projectId: projectId,
    dataset: dataset,
  },
})
