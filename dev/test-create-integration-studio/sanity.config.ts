import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schema'

export default defineConfig({
  plugins: [structureTool()],
  title: 'Strict',
  name: 'default',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  schema: {types: schemaTypes},

  beta: {
    create: {
      startInCreateEnabled: true,
      fallbackStudioOrigin: 'create-integration-test.sanity.studio',
    },
  },
})
