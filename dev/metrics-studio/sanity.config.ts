import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {MetricsStudioIcon} from './MetricsStudioIcon'
import {schemaTypes} from './schemaTypes'
import {comparisonsTool} from './tools/comparisons'
import {trendsTool} from './tools/trends'

export default defineConfig({
  name: 'default',
  title: 'Metrics Studio',
  icon: MetricsStudioIcon,
  projectId: 'mhfozd0z',
  dataset: 'bench',
  // Trends first: it's the dashboard and the studio's default view
  tools: (prev) => [trendsTool, comparisonsTool, ...prev],
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
            S.listItem()
              .title('Commits')
              .child(
                S.documentTypeList('gitCommit')
                  .title('Commits')
                  .defaultOrdering([{field: 'committedAt', direction: 'desc'}]),
              ),
            S.listItem()
              .title('Releases')
              .child(
                S.documentTypeList('gitTag')
                  .title('Releases')
                  .defaultOrdering([{field: 'taggedAt', direction: 'desc'}]),
              ),
          ]),
    }),
  ],
  schema: {types: schemaTypes},
})
