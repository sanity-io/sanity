import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {projectId: 'aeysrmym', dataset: 'production'},
  project: {basePath: '/config-base-path'},
  graphql: [{playground: false}],
})
