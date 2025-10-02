import {defineCliConfig} from 'sanity/cli'

import {API_CONFIG} from './apiConfig'

export default defineCliConfig({
  api: API_CONFIG.production,
  deployment: {
    appId: 'iwyfhbjad8dipooo6r1r28vs',

    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,
  },
})
