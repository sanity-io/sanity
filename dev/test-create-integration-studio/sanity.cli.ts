import {defineCliConfig} from 'sanity/cli'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  vite: (viteConfig) => {
    return viteConfig
  },

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  studioHost: 'create-integration-test',
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  autoUpdates: false,
})
