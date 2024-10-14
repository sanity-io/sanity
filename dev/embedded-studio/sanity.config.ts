import {defineConfig, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

const BLOG_POST_SCHEMA = defineType({
  type: 'document',
  name: 'blogPost',
  title: 'Blog post',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
  ],
})

export const SCHEMA_TYPES = [BLOG_POST_SCHEMA]

export default defineConfig({
  projectId: 'ppsg7ml5',
  dataset: 'test',

  document: {
    unstable_comments: {
      enabled: true,
    },
  },

  schema: {
    types: SCHEMA_TYPES,
  },

  plugins: [structureTool()],
})
