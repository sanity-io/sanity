// eslint-disable-next-line import/no-extraneous-dependencies
import {codeInput} from '@sanity/code-input'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {CustomAction} from './CustomAction'
import {schemaTypes} from './schema'

const baseConfig = defineConfig({
  plugins: [structureTool(), codeInput()],
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
    title: 'Fallback origin',
    name: 'fallback',
    basePath: '/fallback',
    beta: {
      create: {
        fallbackStudioOrigin: 'create-integration-test.sanity.studio',
      },
    },
  },
  {
    ...baseConfig,
    title: 'No fallback origin',
    name: 'no-fallback',
    basePath: '/no-fallback',
  },
  {
    ...baseConfig,
    title: 'Invalid fallback origin',
    name: 'invalid-fallback',
    basePath: '/invalid-fallback',
    beta: {
      create: {
        fallbackStudioOrigin: 'does-not-exist',
      },
    },
  },
  {
    ...baseConfig,
    title: 'Opt out',
    name: 'opt-out',
    basePath: '/opt-out',
    beta: {
      create: {
        startInCreateEnabled: false,
      },
    },
    apps: {
      canvas: {
        enabled: false,
      },
    },
  },
])
