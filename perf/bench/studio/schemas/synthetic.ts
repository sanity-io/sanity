import {type Config} from 'sanity'
import {structureTool} from 'sanity/structure'

import {syntheticSchemaTypes} from './syntheticSchemaTypes'

// Ported from dev/efps/tests/synthetic/sanity.config.ts
export const syntheticWorkspace = {
  name: 'synthetic-bench',
  plugins: [structureTool()],
  schema: {
    types: syntheticSchemaTypes,
  },
} satisfies Partial<Config>
