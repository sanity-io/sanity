// eslint-disable-next-line import/no-extraneous-dependencies
import {codeInput} from '@sanity/code-input'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {CustomAction} from './CustomAction'
import {schemaTypes} from './schema'

const baseConfig = defineConfig({
  plugins: [structureTool(), codeInput(), visionTool()],
  document: {
    actions: [CustomAction],
  },
  projectId: 'ppsg7ml5',
  dataset: 'test',
  schema: {types: schemaTypes},
})

export default defineConfig([
  {
    ...baseConfig,
    projectId: 'exx11uqh',
    dataset: 'playground',
    title: 'Playground',
    name: 'playground',
    basePath: '/playground',
    apiHost: 'https://api.sanity.work',
    apps: {
      canvas: {
        enabled: true,
        fallbackStudioOrigin: 'canvas-integration-staging.sanity.studio',
      },
    },
  },
])
