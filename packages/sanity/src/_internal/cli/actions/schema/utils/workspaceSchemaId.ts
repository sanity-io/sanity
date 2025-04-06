import {
  SANITY_WORKSPACE_SCHEMA_TYPE,
  type WorkspaceSchemaId,
} from '../../../../manifest/manifestTypes'
import {validForIdChars, validForIdPattern} from './schemaStoreValidation'

export function getWorkspaceSchemaId(args: {workspaceName: string; idPrefix?: string}) {
  const {workspaceName: rawWorkspaceName, idPrefix} = args

  let workspaceName = rawWorkspaceName
  let idWarning: string | undefined

  if (!workspaceName.match(validForIdPattern)) {
    workspaceName = workspaceName.replace(new RegExp(`[^${validForIdChars}]`, 'g'), '_')
    idWarning = [
      `Workspace "${rawWorkspaceName}" contains characters unsupported by schema _id [${validForIdChars}], they will be replaced with _.`,
      'This could lead duplicate schema ids: consider renaming your workspace.',
    ].join('\n')
  }
  return {
    safeId:
      `${idPrefix ? (`${idPrefix}.` as const) : ''}${SANITY_WORKSPACE_SCHEMA_TYPE}.${workspaceName}` satisfies WorkspaceSchemaId,
    idWarning,
  }
}
