import {renderSchemaTypes} from './content'

export interface StudioConfigOptions {
  apiHost: string
  dataset: string
  projectId: string
}

/**
 * The studio both versions are built from. It is written over `dev/starter-studio` in each
 * checkout, which exists on every ref and already depends on `sanity`, so no install or
 * lockfile change is needed and both builds compile byte-identical configuration. It stays
 * minimal on purpose: one tool, three document types (`content.ts`), no other plugins.
 */
export function renderStudioConfig({apiHost, dataset, projectId}: StudioConfigOptions): {
  cli: string
  config: string
} {
  const literal = {apiHost, dataset, projectId}
  return {
    cli: `import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {projectId: ${JSON.stringify(literal.projectId)}, dataset: ${JSON.stringify(literal.dataset)}},
  autoUpdates: false,
})
`,
    config: `import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Version comparison studio',
  projectId: ${JSON.stringify(literal.projectId)},
  dataset: ${JSON.stringify(literal.dataset)},
  apiHost: ${JSON.stringify(literal.apiHost)},
  plugins: [structureTool()],
  schema: {
    types: ${renderSchemaTypes()},
  },
  announcements: {enabled: false},
})
`,
  }
}
