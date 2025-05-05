import {
  type DefaultWorkspaceSchemaId,
  SANITY_WORKSPACE_SCHEMA_ID_PREFIX,
  type WorkspaceSchemaId,
} from '../../../../manifest/manifestTypes'
import {validForNamesChars, validForNamesPattern} from './schemaStoreValidation'

export function getWorkspaceSchemaId(args: {workspaceName: string; tag?: string}) {
  const {workspaceName: rawWorkspaceName, tag} = args

  let workspaceName = rawWorkspaceName
  let idWarning: string | undefined

  // The HTTP API replaces periods with _ in the workspace name, so the CLI should too
  if (!workspaceName.match(validForNamesPattern)) {
    workspaceName = workspaceName.replace(new RegExp(`[^${validForNamesChars}]`, 'g'), '_')
    idWarning = [
      `Workspace "${rawWorkspaceName}" contains characters unsupported by schema _id [${validForNamesChars}], they will be replaced with _.`,
      'This could lead duplicate schema ids: consider renaming your workspace.',
    ].join('\n')
  }

  const safeBaseId: DefaultWorkspaceSchemaId = `${SANITY_WORKSPACE_SCHEMA_ID_PREFIX}.${workspaceName}`
  return {
    safeBaseId,
    safeTaggedId: `${safeBaseId}${tag ? (`.${tag}` as const) : ''}` satisfies WorkspaceSchemaId,
    idWarning,
  }
}
