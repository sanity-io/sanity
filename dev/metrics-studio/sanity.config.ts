import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {MetricsStudioIcon} from './MetricsStudioIcon'
import {schemaTypes} from './schemaTypes'
import {bisectTool} from './tools/bisect'
import {comparisonsTool} from './tools/comparisons'
import {releasesTool} from './tools/releases'
import {trendsTool} from './tools/trends'

export default defineConfig({
  name: 'default',
  title: 'Metrics Studio',
  icon: MetricsStudioIcon,
  projectId: 'mhfozd0z',
  dataset: 'bench',
  // Trends first (the dashboard and default view), raw document access
  // second, then the investigation tools — comparisons last, it's the least
  // visited
  tools: (prev) => {
    const structure = prev.filter((tool) => tool.name === 'structure')
    // Drop the built-in Content Releases tool: this dataset has no content
    // releases, and our release-tags tool owns the "Releases" name
    const rest = prev.filter((tool) => tool.name !== 'structure' && tool.name !== 'releases')
    return [trendsTool, releasesTool, bisectTool, ...structure, ...rest, comparisonsTool]
  },
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
