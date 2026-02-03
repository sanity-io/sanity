import {schemaTypes} from '../../../packages/@sanity/cli/templates/blog/schemaTypes'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Blog studio example',

  projectId: 'cgd8g1dj',
  dataset: 'production',

  schema: {
    types: schemaTypes,
  },

  plugins: [structureTool()],
})
