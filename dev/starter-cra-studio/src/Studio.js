/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/react-in-jsx-scope */
import {createConfig, deskTool, Studio} from 'sanity'

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

export default function CraStudio() {
  return <Studio config={config} />
}
