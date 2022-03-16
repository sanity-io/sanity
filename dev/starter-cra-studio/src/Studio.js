/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/react-in-jsx-scope */
import {createConfig} from '@sanity/base'
import {StudioRoot} from '@sanity/base/studio'
import {deskTool} from '@sanity/desk-tool'

const config = createConfig({
  plugins: [deskTool()],
  project: {
    name: 'CRA Starter',
  },
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

function Studio() {
  return <StudioRoot config={config} />
}

export default Studio
