import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemaTypes'
import {resolveDocumentNode, structure} from './structure'
import {templates} from './templates'

export default defineConfig({
  plugins: [
    structureTool({
      defaultDocumentNode: resolveDocumentNode,
      structure,
    }),
    // @todo
    // visionTool(),
  ],
  name: 'default',
  title: 'Design Studio',
  projectId: 'ppsg7ml5',
  dataset: 'design-studio',
  schema: {
    templates,
    types: schemaTypes,
  },
})
