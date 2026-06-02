import {defineConfig} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'issue-12927-repro',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      {
        name: 'thing',
        title: 'Thing',
        type: 'document',
        fields: [{name: 'title', type: 'string', title: 'Title'}],
      },
    ],
  },
})
