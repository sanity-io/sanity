import {type CliOutputter} from '@sanity/cli'
import uniqBy from 'lodash/uniqBy'

import {isDefined} from '../../../../manifest/manifestTypeHelpers'
import {SANITY_WORKSPACE_SCHEMA_TYPE} from '../../../../manifest/manifestTypes'
import {type DeleteSchemaFlags} from '../deleteSchemaAction'
import {type SchemaListFlags} from '../listSchemasAction'
import {type StoreSchemasFlags} from '../storeSchemasAction'
import {resolveManifestDirectory} from './manifestReader'

export const validForIdChars = 'a-zA-Z0-9._-'
export const validForIdPattern = new RegExp(`^[${validForIdChars}]+$`, 'g')

const requiredInId = SANITY_WORKSPACE_SCHEMA_TYPE.replace(/[.]/g, '\\.')
const idPattern = new RegExp(
  `^(?:[${validForIdChars}]+?\\.)?${requiredInId}\\.([${validForIdChars}]+)$`,
)

export class FlagValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FlagValidationError'
  }
}

interface WorkspaceSchemaId {
  schemaId: string
  workspace: string
}

export interface StoreSchemaCommonFlags {
  'extract-manifest'?: boolean
  'manifest-dir'?: string
  'verbose'?: boolean
}

function parseCommonFlags(
  flags: StoreSchemaCommonFlags,
  context: {workDir: string},
  errors: string[],
) {
  const manifestDir = parseManifestDir(flags, errors)
  const verbose = !!flags.verbose
  // extract manifest by default: our CLI layer handles both --extract-manifest (true) and --no-extract-manifest (false)
  const extractManifest = flags['extract-manifest'] ?? true

  const fullManifestDir = resolveManifestDirectory(context.workDir, manifestDir)
  return {
    manifestDir: fullManifestDir,
    verbose,
    extractManifest,
  }
}

export function parseStoreSchemasConfig(flags: StoreSchemasFlags, context: {workDir: string}) {
  const errors: string[] = []

  const commonFlags = parseCommonFlags(flags, context, errors)
  const workspaceName = parseWorkspace(flags, errors)
  const idPrefix = parseIdPrefix(flags, errors)
  const schemaRequired = !!flags['schema-required']

  assertNoErrors(errors)
  return {...commonFlags, workspaceName, idPrefix, schemaRequired}
}

export function parseListSchemasConfig(flags: SchemaListFlags, context: {workDir: string}) {
  const errors: string[] = []

  const commonFlags = parseCommonFlags(flags, context, errors)
  const id = parseId(flags, errors)
  const json = !!flags.json

  assertNoErrors(errors)
  return {...commonFlags, json, id}
}

export function parseDeleteSchemasConfig(flags: DeleteSchemaFlags, context: {workDir: string}) {
  const errors: string[] = []

  const commonFlags = parseCommonFlags(flags, context, errors)
  const ids = parseIds(flags, errors)
  const dataset = parseDataset(flags, errors)

  assertNoErrors(errors)
  return {...commonFlags, dataset, ids}
}

function assertNoErrors(errors: string[]) {
  if (errors.length) {
    throw new FlagValidationError(
      `Invalid arguments:\n${errors.map((error) => `  - ${error}`).join('\n')}`,
    )
  }
}

export function parseIds(flags: {ids?: unknown}, errors: string[]): WorkspaceSchemaId[] {
  const parsedIds = parseNonEmptyString(flags, 'ids', errors)
  if (errors.length) {
    return []
  }

  const ids = parsedIds
    .split(',')
    .map((id) => id.trim())
    .filter((id) => !!id)
    .map((id) => parseWorkspaceSchemaId(id, errors))
    .filter(isDefined)

  const uniqueIds = uniqBy(ids, 'schemaId' satisfies keyof (typeof ids)[number])
  if (uniqueIds.length < ids.length) {
    errors.push(`ids contains duplicates`)
  }
  if (!errors.length && !uniqueIds.length) {
    errors.push(`ids contains no valid id strings`)
  }
  return uniqueIds
}

export function parseId(flags: {id?: unknown}, errors: string[]) {
  const id = flags.id === undefined ? undefined : parseNonEmptyString(flags, 'id', errors)
  if (id) {
    return parseWorkspaceSchemaId(id, errors)?.schemaId
  }
  return undefined
}

export function parseWorkspaceSchemaId(id: string, errors: string[]) {
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

  const match = trimmedId.match(idPattern)
  const workspace = match?.[1] ?? ''
  if (!workspace) {
    errors.push(
      `id must end with ${SANITY_WORKSPACE_SCHEMA_TYPE}.<workspaceName> but found: "${trimmedId}"`,
    )
    return undefined
  }
  return {
    schemaId: trimmedId,
    workspace,
  }
}

function parseDataset(flags: {dataset?: unknown}, errors: string[]) {
  return flags.dataset === undefined ? undefined : parseNonEmptyString(flags, 'dataset', errors)
}

function parseWorkspace(flags: {workspace?: unknown}, errors: string[]) {
  return flags.workspace === undefined ? undefined : parseNonEmptyString(flags, 'workspace', errors)
}

function parseManifestDir(flags: {'manifest-dir'?: unknown}, errors: string[]) {
  return flags['manifest-dir'] === undefined
    ? undefined
    : parseNonEmptyString(flags, 'manifest-dir', errors)
}

export function parseIdPrefix(flags: {'id-prefix'?: unknown}, errors: string[]) {
  if (flags['id-prefix'] === undefined) {
    return undefined
  }

  const idPrefix = parseNonEmptyString(flags, 'id-prefix', errors)
  if (errors.length) {
    return undefined
  }

  if (idPrefix.endsWith('.')) {
    errors.push(`id-prefix argument cannot end with . (period), but was: "${idPrefix}"`)
    return undefined
  }

  if (!idPrefix.match(validForIdPattern)) {
    errors.push(
      `id-prefix can only contain _id compatible characters [${validForIdChars}], but was: "${idPrefix}"`,
    )
    return undefined
  }

  if (idPrefix.startsWith('-')) {
    errors.push(`id-prefix cannot start with - (dash) but was: "${idPrefix}"`)
    return undefined
  }

  if (idPrefix.match(/\.\./g)) {
    errors.push(`id-prefix cannot have consecutive . (period) characters, but was: "${idPrefix}"`)
    return undefined
  }

  return idPrefix
}

function parseNonEmptyString<
  Flag extends string,
  Flags extends Partial<Record<Flag, unknown | undefined>>,
>(flags: Flags, flagName: Flag, errors: string[]): string {
  const flag = flags[flagName]
  if (!isString(flag) || !flag) {
    errors.push(`${flagName} argument is empty`)
    return ''
  }
  return flag
}

function isString(flag: unknown): flag is string {
  return typeof flag === 'string'
}

function getProjectIdMismatchMessage(
  workspace: {name: string; projectId: string},
  operation: 'read' | 'write',
) {
  return `No permissions to ${operation} schema for workspace "${workspace.name}" with projectId "${workspace.projectId}"`
}

/**
 * At the moment schema store commands does not support studios where workspaces have multiple projects
 */
export function throwWriteProjectIdMismatch(
  workspace: {name: string; projectId: string},
  projectId: string,
): void {
  if (workspace.projectId !== projectId) {
    throw new Error(getProjectIdMismatchMessage(workspace, 'write'))
  }
}

export function filterLogReadProjectIdMismatch(
  workspace: {name: string; projectId: string},
  projectId: string,
  output: CliOutputter,
) {
  const canRead = workspace.projectId === projectId
  if (!canRead) output.warn(`${getProjectIdMismatchMessage(workspace, 'read')} – ignoring it.`)
  return canRead
}
