import {useWorkspace} from '../studio/workspace'

/**
 * @alpha
 * Return the schema id for the current workspace
 */
export const useWorkspaceSchemaId = (): string => {
  const workspace = useWorkspace()
  return `_.schemas.${workspace.name || 'default'}`
}
