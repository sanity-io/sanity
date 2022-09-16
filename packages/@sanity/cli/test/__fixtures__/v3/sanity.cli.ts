import {createCliConfig} from 'sanity/cli'

export default createCliConfig({
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
