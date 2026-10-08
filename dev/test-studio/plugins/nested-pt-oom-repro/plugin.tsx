import {definePlugin} from 'sanity'
import {structureTool} from 'sanity/structure'

import {NESTED_PT_OOM_PAGE_TYPE, nestedPtOomSchemaTypes} from './schema'

/**
 * Standalone workspace schema for the Morrowbank nested portable-text crash.
 * Kept off the shared test-studio schema so the recursive block content is not
 * compiled into every other workspace.
 */
export const nestedPtOomRepro = definePlugin({
  name: 'nested-pt-oom-repro',
  schema: {
    types: nestedPtOomSchemaTypes,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Nested PT OOM')
          .items([
            S.documentTypeListItem(NESTED_PT_OOM_PAGE_TYPE).title('Pages'),
            S.divider(),
            S.documentTypeListItem('urls').title('URLs'),
            S.documentTypeListItem('strategicData').title('Strategic data'),
          ]),
    }),
  ],
})
