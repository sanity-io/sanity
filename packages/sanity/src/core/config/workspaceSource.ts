import {type Source, type Workspace, type WorkspaceSummary} from './types'

/**
 * Builds a resolved workspace from its summary and its resolved source.
 *
 * @internal
 */
export function createWorkspace(summary: WorkspaceSummary, source: Source): Workspace {
  const {releases: _releases, ...workspaceMetadata} = summary
  return {
    ...workspaceMetadata,
    ...source,
    // oxlint-disable-next-line no-deprecated -- kept for consumers that still read it
    unstable_sources: [source],
    type: 'workspace',
  }
}

/**
 * Returns the source of a resolved workspace. A workspace has exactly one
 * source, so this is the single place that reads the deprecated
 * `unstable_sources` list.
 *
 * @internal
 */
export function getWorkspaceSource(workspace: Workspace): Source {
  // oxlint-disable-next-line no-deprecated -- the one place that reads it, see above
  return workspace.unstable_sources[0]
}
