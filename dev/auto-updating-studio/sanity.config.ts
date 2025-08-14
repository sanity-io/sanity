import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Auto Updating Studios Test',

  projectId: 'ppsg7ml5',
  dataset: 'autoupdates',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
