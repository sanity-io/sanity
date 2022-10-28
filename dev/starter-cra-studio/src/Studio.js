/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/react-in-jsx-scope */

import {defineConfig, Studio} from 'sanity'
import {deskTool} from 'sanity/desk'

const config = defineConfig({
  plugins: [deskTool()],
  name: 'default',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  title: 'Default',
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
})

export function CraStudio() {
  return <Studio config={config} />
}
