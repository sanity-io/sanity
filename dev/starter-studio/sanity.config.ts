import {createConfig} from '@sanity/base'
import {deskTool} from '@sanity/desk-tool'

export default createConfig({
  plugins: [deskTool()],
  project: {name: 'Starter'},
  sources: [
    {
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'test',
      title: 'Default',
      schemaTypes: [
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
  ],
})
