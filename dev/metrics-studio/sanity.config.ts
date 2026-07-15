import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemaTypes'
import {trendsTool} from './tools/trends'

export default defineConfig({
  name: 'default',
  title: 'Metrics Studio',
  projectId: 'mhfozd0z',
  dataset: 'bench',
  // Trends first: it's the dashboard and the studio's default view
  tools: (prev) => [trendsTool, ...prev],
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Health metrics')
          .items([
            S.listItem()
              .title('Benchmark runs')
              .child(
                S.documentTypeList('benchRun')
                  .title('Benchmark runs')
                  .defaultOrdering([{field: 'startedAt', direction: 'desc'}]),
              ),
          ]),
    }),
  ],
  schema: {types: schemaTypes},
})
