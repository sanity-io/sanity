import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'page-building',
  title: 'Page Building',

  projectId: 'ppsg7ml5',
  dataset: 'page-building',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
