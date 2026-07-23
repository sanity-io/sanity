// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'test',
  },
})
