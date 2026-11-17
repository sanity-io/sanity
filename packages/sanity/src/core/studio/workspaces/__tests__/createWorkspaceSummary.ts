import {buildTheme} from '@sanity/ui/theme'

import {type Workspace, type WorkspaceSummary} from '../../../config/types'

const THEME = buildTheme()

/**
 * Builds a `WorkspaceSummary` fixture for story harnesses that render under
 * `TestWrapper`: schema, locale source and plugin options come from the
 * mock workspace, so the summary is fully typed without casts. The default
 * `auth` store is the mock workspace's own.
 */
export function createWorkspaceSummary(
  workspace: Workspace,
  overrides: Pick<WorkspaceSummary, 'name' | 'title' | 'basePath'> &
    Partial<Pick<WorkspaceSummary, 'auth' | 'projectId' | 'dataset'>>,
): WorkspaceSummary {
  return {
    type: 'workspace-summary',
    icon: null,
    customIcon: false,
    projectId: workspace.projectId,
    dataset: workspace.dataset,
    auth: workspace.auth,
    theme: THEME,
    schema: workspace.schema,
    i18n: workspace.i18n,
    comments: {v2: false},
    tasks: {enabled: false},
    scheduledDrafts: {enabled: false},
    variants: {enabled: false},
    scheduledPublishing: workspace.scheduledPublishing,
    releases: {enabled: false},
    // oxlint-disable-next-line no-deprecated -- required field on WorkspaceSummary
    __internal: {sources: []},
    ...overrides,
  }
}
