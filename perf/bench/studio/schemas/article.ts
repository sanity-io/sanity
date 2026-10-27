import {type Config} from 'sanity'
import {structureTool} from 'sanity/structure'

import {articleSchemaTypes} from './articleSchemaTypes'

// Ported from dev/efps/tests/article/sanity.config.ts
export const articleWorkspace = {
  name: 'article-bench',
  plugins: [structureTool()],
  schema: {
    types: articleSchemaTypes,
  },
} satisfies Partial<Config>
