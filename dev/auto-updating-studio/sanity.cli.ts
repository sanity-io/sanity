import {defineCliConfig} from 'sanity/cli'

import {dataset, projectId} from './apiConfig'

export default defineCliConfig({
  api: {dataset, projectId},
  deployment: {
    appId: 'iwyfhbjad8dipooo6r1r28vs',

    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,
  },
})
