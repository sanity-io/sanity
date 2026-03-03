import {getWorkspaceSchemaId} from '@sanity/schema/_internal'

import {useWorkspace} from '../studio/workspace'

/**
 * @alpha
 * Return the schema id for the current workspace
 */
export const useWorkspaceSchemaId = (): string => {
  const workspace = useWorkspace()
  return getWorkspaceSchemaId({workspaceName: workspace.name || 'default'}).safeBaseId
}
