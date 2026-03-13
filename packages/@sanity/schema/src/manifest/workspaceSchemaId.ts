import {
  CURRENT_WORKSPACE_SCHEMA_VERSION,
  type ManifestSchemaType,
  SANITY_WORKSPACE_SCHEMA_ID_PREFIX,
  type StoredWorkspaceSchema,
  type DefaultWorkspaceSchemaId,
  type WorkspaceSchemaId,
} from './manifestTypes'

// Character sets for workspace/tag names (no periods allowed)
export const validForNamesChars = 'a-zA-Z0-9_-'
export const validForNamesPattern = new RegExp(`^[${validForNamesChars}]+$`, 'g')

// Character sets for full schema IDs
const validForIdChars = 'a-zA-Z0-9._-'
const validForIdPattern = new RegExp(`^[${validForIdChars}]+$`, 'g')

// Regex patterns for parsing schema IDs
const requiredInId = SANITY_WORKSPACE_SCHEMA_ID_PREFIX.replace(/[.]/g, '\\.')
const idPatternString = `^${requiredInId}\\.([${validForNamesChars}]+)`
const baseIdPattern = new RegExp(`${idPatternString}$`)
const taggedIdPattern = new RegExp(`${idPatternString}\\.tag\\.([${validForNamesChars}]+)$`)

export function getWorkspaceSchemaId(args: {workspaceName: string; tag?: string}): {
  safeBaseId: DefaultWorkspaceSchemaId
  safeTaggedId: WorkspaceSchemaId
  idWarning: string | undefined
} {
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
    safeTaggedId: `${safeBaseId}${tag ? (`.tag.${tag}` as const) : ''}` satisfies WorkspaceSchemaId,
    idWarning,
  }
}

export interface ParsedWorkspaceSchemaId {
  schemaId: string
  workspace: string
}

export function parseWorkspaceSchemaId(
  id: string,
  errors: string[],
): ParsedWorkspaceSchemaId | undefined {
  const trimmedId = id.trim()

  if (!trimmedId.match(validForIdPattern)) {
    errors.push(`id can only contain characters in [${validForIdChars}] but found: "${trimmedId}"`)
    return undefined
  }

  if (trimmedId.startsWith('-')) {
    errors.push(`id cannot start with - (dash) but found: "${trimmedId}"`)
    return undefined
  }

  if (trimmedId.match(/\.\./g)) {
    errors.push(`id cannot have consecutive . (period) characters, but found: "${trimmedId}"`)
    return undefined
  }

  const [, workspace] = trimmedId.match(taggedIdPattern) ?? trimmedId.match(baseIdPattern) ?? []
  if (!workspace) {
    errors.push(
      [
        `id must either match ${SANITY_WORKSPACE_SCHEMA_ID_PREFIX}.<workspaceName> `,
        `or ${SANITY_WORKSPACE_SCHEMA_ID_PREFIX}.<workspaceName>.tag.<tag> but found: "${trimmedId}". `,
        `Note that workspace name characters not in [${validForNamesChars}] has to be replaced with _ for schema id.`,
      ].join(''),
    )
    return undefined
  }

  return {
    schemaId: trimmedId,
    workspace,
  }
}

export function createStoredWorkspaceSchemaPayload(args: {
  workspace: {name: string; title?: string}
  schema: ManifestSchemaType[]
  tag?: string
}): Omit<StoredWorkspaceSchema, '_id' | '_type'> {
  return {
    version: CURRENT_WORKSPACE_SCHEMA_VERSION,
    tag: args.tag,
    workspace: {
      name: args.workspace.name,
      title: args.workspace.title,
    },
    schema: args.schema,
  }
}
