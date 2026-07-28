import {defineCliConfig} from 'sanity/cli'

import {apiConfig} from './studio/apiConfig'

export default defineCliConfig({
  api: {
    projectId: apiConfig.projectId,
    dataset: apiConfig.dataset,
  },
  autoUpdates: false,
})
