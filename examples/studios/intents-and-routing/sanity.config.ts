import {schemaTypes} from './schemaTypes'
import intentTest from './tools/approvals'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'studio-e2e-testing',

  projectId: 'kin4wkua',
  dataset: 'production',

  tools: [intentTest],
  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
