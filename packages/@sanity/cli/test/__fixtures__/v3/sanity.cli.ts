import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'aeysrmym',
    dataset: 'production',
  },

  graphql: [
    {
      playground: false,
      workspace: 'default', // @todo remove
    },
  ],
})
