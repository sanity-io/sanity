import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {RadarIcon} from './RadarIcon'
import {schemaTypes} from './schemaTypes'
import {bisectTool} from './tools/bisect'
import {comparisonsTool} from './tools/comparisons'
import {diagnosticsTool} from './tools/diagnostics'
import {releasesTool} from './tools/releases'
import {trendsTool} from './tools/trends'

export default defineConfig({
  name: 'default',
  title: 'Studio Radar',
  icon: RadarIcon,
  projectId: 'mhfozd0z',
  dataset: 'bench',
  // Trends first (the dashboard and default view), then the investigation
  // tools (releases, bisect, pasted diagnostics), then raw document access —
  // comparisons last, it's the least visited
  tools: (prev) => {
    const structure = prev.filter((tool) => tool.name === 'structure')
    const rest = prev.filter((tool) => tool.name !== 'structure')
    return [
      trendsTool,
      releasesTool,
      bisectTool,
      diagnosticsTool,
      ...structure,
      ...rest,
      comparisonsTool,
    ]
  },
  releases: {enabled: false},
  scheduledDrafts: {enabled: false},
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
            S.listItem()
              .title('Bisect sessions')
              .child(
                S.documentTypeList('bisectSession')
                  .title('Bisect sessions')
                  .defaultOrdering([{field: 'createdAt', direction: 'desc'}]),
              ),
          ]),
    }),
  ],
  schema: {types: schemaTypes},
})
