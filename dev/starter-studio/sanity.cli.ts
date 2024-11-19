import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'test',
  },
  reactCompiler: {target: '18'},
})
