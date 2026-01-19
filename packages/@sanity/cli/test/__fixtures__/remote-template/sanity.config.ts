import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  plugins: [structureTool()],
  schema: {
    types: [],
  },
})
