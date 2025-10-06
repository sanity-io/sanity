import {defineCliConfig} from 'sanity/cli'

import {ENV_CONFIG} from './apiConfig'

export default defineCliConfig({
  api: ENV_CONFIG.production.api,
  deployment: {
    appId: ENV_CONFIG.production.appId,

    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,
  },
})
