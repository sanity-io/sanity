import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'exx11uqh',
    dataset: 'playground',
  },

  studioHost: 'canvas-integration-staging',
  autoUpdates: false,
})
