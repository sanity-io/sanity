// eslint-disable-next-line import/no-extraneous-dependencies
import {codeInput} from '@sanity/code-input'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schema'

const baseConfig = defineConfig({
  plugins: [structureTool(), codeInput()],
  projectId: 'ppsg7ml5',
  dataset: 'test',
  schema: {types: schemaTypes},
})

export default defineConfig([
  {
    ...baseConfig,
    title: 'Fallback origin',
    name: 'fallback',
    basePath: '/fallback',
    beta: {
      create: {
        startInCreateEnabled: true,
        fallbackStudioOrigin: 'create-integration-test.sanity.studio',
      },
    },
  },
  {
    ...baseConfig,
    title: 'No fallback origin',
    name: 'no-fallback',
    basePath: '/no-fallback',
    beta: {
      create: {
        startInCreateEnabled: true,
      },
    },
  },
  {
    ...baseConfig,
    title: 'Invalid fallback origin',
    name: 'invalid-fallback',
    basePath: '/invalid-fallback',
    beta: {
      create: {
        startInCreateEnabled: true,
        fallbackStudioOrigin: 'does-not-exist',
      },
    },
  },
])
