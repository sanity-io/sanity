import {defineCliConfig} from 'sanity/cli'

if (!process.env.SANITY_E2E_PROJECT_ID || !process.env.SANITY_E2E_DATASET) {
  throw new Error('SANITY_E2E_PROJECT_ID and SANITY_E2E_DATASET must be set')
}

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_E2E_PROJECT_ID,
    dataset: process.env.SANITY_E2E_DATASET,
  },
})
