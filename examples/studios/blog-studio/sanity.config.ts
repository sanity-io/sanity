import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from '../../packages/@sanity/cli/templates/blog/schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Blog studio example',

  projectId: 'ppsg7ml5',
  dataset: 'blog',

  schema: {
    types: schemaTypes,
  },

  plugins: [structureTool()],
})
