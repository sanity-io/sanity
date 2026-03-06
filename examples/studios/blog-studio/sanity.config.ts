import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemaTypes'

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
