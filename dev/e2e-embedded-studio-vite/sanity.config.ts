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

const projectId = import.meta.env.SANITY_E2E_PROJECT_ID
const dataset = import.meta.env.SANITY_E2E_DATASET

if (!projectId || !dataset) {
  throw new Error('SANITY_E2E_PROJECT_ID and SANITY_E2E_DATASET must be set')
}

export default defineConfig({
  projectId: projectId,
  dataset: dataset,
  schema: {
    types: SCHEMA_TYPES,
  },
  scheduledPublishing: {
    enabled: false,
  },
  plugins: [structureTool()],
  apiHost: 'https://api.sanity.work',
})
