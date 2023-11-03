import {defineCliConfig} from 'sanity/cli'
import {loadEnvFiles} from '../../scripts/utils/loadEnvFiles'

loadEnvFiles()

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_E2E_PROJECT_ID,
    dataset: process.env.SANITY_E2E_DATASET,
  },
  vite: {
    define: {
      'process.env.SANITY_E2E_PROJECT_ID': JSON.stringify(process.env.SANITY_E2E_PROJECT_ID),
      'process.env.SANITY_E2E_DATASET': JSON.stringify(process.env.SANITY_E2E_DATASET),
    },
  },
})
