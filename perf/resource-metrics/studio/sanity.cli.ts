import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    // Used by the CLI for build/preview. Matches the first workspace (PROJECT_A).
    projectId: 'ppsg7ml5',
    dataset: 'resource-metrics',
  },
})
