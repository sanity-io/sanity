import {schemaTypes} from '../../packages/@sanity/cli/templates/clean/schemaTypes'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Clean studio',

  projectId: 'ppsg7ml5',
  dataset: 'clean',

  schema: {
    types: schemaTypes,
  },

  plugins: [structureTool()],
})
