import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {dataset, projectId} from './apiConfig'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Auto Updating Studios Test',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
