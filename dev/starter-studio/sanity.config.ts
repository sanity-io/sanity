import {createConfig, deskTool} from 'sanity'

export default createConfig({
  dataset: 'test',
  plugins: [deskTool()],
  name: 'default',
  projectId: 'ppsg7ml5',
  schema: {
    types: [
      {
        type: 'document',
        name: 'post',
        title: 'Post',
        fields: [
          {
            type: 'string',
            name: 'title',
            title: 'Title',
          },
        ],
      },
    ],
  },
  title: 'Starter Studio',
})
