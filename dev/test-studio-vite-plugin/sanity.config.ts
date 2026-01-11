import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'test-studio',
  title: 'Test Studio',
  projectId: 'ctdk8bjw',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: [
      {
        name: 'post',
        title: 'Post',
        type: 'document',
        fields: [
          {name: 'title', title: 'Title', type: 'string'},
          {name: 'body', title: 'Body', type: 'text'},
        ],
      },
    ],
  },
})
