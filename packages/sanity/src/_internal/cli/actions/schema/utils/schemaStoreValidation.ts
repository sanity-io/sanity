import {
  type ParsedWorkspaceSchemaId,
  parseWorkspaceSchemaId,
  validForNamesChars,
  validForNamesPattern,
} from '@sanity/schema/_internal'
import uniqBy from 'lodash-es/uniqBy.js'

import {type DeleteSchemaFlags} from '../deleteSchemaAction'
import {type DeploySchemasFlags} from '../deploySchemasAction'
import {type SchemaListFlags} from '../listSchemasAction'
import {resolveManifestDirectory} from './manifestReader'

export class FlagValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FlagValidationError'
  }
}

export interface SchemaStoreCommonFlags {
  'extract-manifest'?: boolean
  'manifest-dir'?: string
  'verbose'?: boolean
}

function parseCommonFlags(
  flags: SchemaStoreCommonFlags,
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

export function parseDeploySchemasConfig(flags: DeploySchemasFlags, context: {workDir: string}) {
  const errors: string[] = []

  const commonFlags = parseCommonFlags(flags, context, errors)
  const workspaceName = parseWorkspace(flags, errors)
  const tag = parseTag(flags, errors)
  const schemaRequired = !!flags['schema-required']

  assertNoErrors(errors)
  return {...commonFlags, workspaceName, tag, schemaRequired}
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

export function parseIds(flags: {ids?: unknown}, errors: string[]): ParsedWorkspaceSchemaId[] {
  const parsedIds = parseNonEmptyString(flags, 'ids', errors)
  if (errors.length) {
    return []
  }

  const ids = parsedIds
    .split(',')
    .map((id) => id.trim())
    .filter((id) => !!id)
    .map((id) => parseWorkspaceSchemaId(id, errors))
    .filter((v): v is ParsedWorkspaceSchemaId => v !== undefined)

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

export function parseTag(flags: {tag?: unknown}, errors: string[]) {
  if (flags.tag === undefined) {
    return undefined
  }

  const tag = parseNonEmptyString(flags, 'tag', errors)
  if (errors.length) {
    return undefined
  }

  if (tag.includes('.')) {
    errors.push(`tag cannot contain . (period), but was: "${tag}"`)
    return undefined
  }

  if (!tag.match(validForNamesPattern)) {
    errors.push(`tag can only contain characters in [${validForNamesChars}], but was: "${tag}"`)
    return undefined
  }

  if (tag.startsWith('-')) {
    errors.push(`tag cannot start with - (dash) but was: "${tag}"`)
    return undefined
  }

  return tag
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

export const SCHEMA_PERMISSION_HELP_TEXT =
  'For multi-project workspaces, set SANITY_AUTH_TOKEN environment variable to a token with access to the workspace projects.'
