import {defineCliConfig} from 'sanity/cli'

import {apiConfig} from './studio/apiConfig'

export default defineCliConfig({
  api: {
    projectId: apiConfig.projectId,
    dataset: apiConfig.dataset,
  },
  // `bench export-costs` builds an auto-updating variant that loads `sanity` from a local module
  // host (SANITY_MODULES_HOST), the way auto-updating studios load it from the CDN
  deployment: {autoUpdates: process.env.SANITY_BENCH_AUTO_UPDATES === 'true'},
})
