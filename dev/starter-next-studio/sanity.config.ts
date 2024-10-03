import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  plugins: [structureTool()],
  title: 'Next.js Starter',
  projectId: 'ppsg7ml5',
  dataset: 'test',
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
