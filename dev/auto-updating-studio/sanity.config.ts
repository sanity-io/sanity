import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {API_CONFIG} from './apiConfig'
import {schemaTypes} from './schemaTypes'

export default defineConfig([
  {
    basePath: '/staging',
    name: 'staging',
    title: 'Auto Updating Studios Test',
    ...API_CONFIG.staging,
    plugins: [structureTool(), visionTool()],

    schema: {
      types: schemaTypes,
    },
  },
  {
    basePath: '/production',
    name: 'production',
    title: 'Auto Updating Studios Test',
    ...API_CONFIG.production,
    plugins: [structureTool(), visionTool()],

    schema: {
      types: schemaTypes,
    },
  },
])
