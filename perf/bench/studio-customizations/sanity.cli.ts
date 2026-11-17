import {defineCliConfig} from 'sanity/cli'

import {apiConfig} from '../studio/apiConfig'

export default defineCliConfig({
  api: {
    projectId: apiConfig.projectId,
    dataset: apiConfig.dataset,
  },
  // oxlint-disable-next-line no-deprecated -- mirrors ../sanity.cli.ts
  autoUpdates: false,
})
