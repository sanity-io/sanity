import {isMainThread, parentPort, workerData, MessagePort} from 'worker_threads'
import oneline from 'oneline'
import {isPlainObject} from 'lodash'
import type {Schema} from '@sanity/types'
import type {CliCommandContext} from '@sanity/cli'
import type {SchemaDefinitionish} from '../actions/typegen/types'
import {getStudioConfig} from '../util/getStudioConfig'
import {Workspace} from 'sanity'

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

getSchemaDocumentTypeDefinitionsForked(parentPort)

async function getSchemaDocumentTypeDefinitionsForked(parent: MessagePort): Promise<void> {
  const {workDir, workspace} = workerData
  const resolved = await resolveSchemaDocumentTypeDefinitions({workDir, workspace})
  parent.postMessage(resolved)
}

async function resolveSchemaDocumentTypeDefinitions({
  workDir,
  workspace,
}: Pick<CliCommandContext, 'workDir'> & {
  workspace?: string
}): Promise<{
  projectId: string
  dataset: string
  schemaTypes: SchemaDefinitionish[]
}> {
  const workspaces = await getStudioConfig({basePath: workDir})
  const numSources = workspaces.reduce(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (count, workspace) => count + workspace.unstable_sources.length,
    0,
  )
  const multiSource = numSources > 1
  const multiWorkspace = workspaces.length > 1

  if (workspaces.length === 0) {
    throw new Error('No studio configuration found')
  }

  if (numSources === 0) {
    throw new Error('No sources (project ID / dataset) configured')
  }

  // We can only automatically configure if there is a single workspace + source in play
  if ((multiWorkspace || multiSource) && !workspace) {
    throw new Error(oneline`
      Multiple workspaces/sources configured.
      You must define the name of the workspace you wish to introspect.
    `)
  }

  // No config is defined, but we have a single workspace + source, so use that
  if (!workspace) {
    const {projectId, dataset, schema} = workspaces[0].unstable_sources[0]
    return {
      projectId,
      dataset,
      schemaTypes: await getStrippedSchemaTypes(schema),
    }
  }

  // Explicity defined config
  return resolveSchemaFromConfig(workspaces, workspace)
}

async function resolveSchemaFromConfig(
  workspaces: Workspace[],
  workspaceName: string,
): Promise<{projectId: string; dataset: string; schemaTypes: SchemaDefinitionish[]}> {
  if (!workspaceName && workspaces.length > 1) {
    throw new Error('Must define `workspace` name when multiple workspaces are defined')
  }

  // If we only have a single workspace defined, we can assume that is the intended one,
  // even if no `workspace` is defined for the GraphQL API
  const workspace =
    !workspaceName && workspaces.length === 1
      ? workspaces[0]
      : workspaces.find((space) => space.name === (workspaceName || 'default'))

  if (!workspace) {
    throw new Error(`Workspace "${workspaceName || 'default'}" not found`)
  }

  // @TODO investigate if `sourceName` is needed
  let sourceName: string | undefined

  // If we only have a single source defined, we can assume that is the intended one,
  // even if no `source` is defined for the GraphQL API
  const source =
    !sourceName && workspace.unstable_sources.length === 1
      ? workspace.unstable_sources[0]
      : workspace.unstable_sources.find((src) => src.name === (sourceName || 'default'))

  if (!source) {
    throw new Error(
      `Source "${sourceName || 'default'}" not found in workspace "${workspaceName || 'default'}"`,
    )
  }

  return {
    dataset: source.dataset,
    projectId: source.projectId,
    schemaTypes: getStrippedSchemaTypes(source.schema),
  }
}

function getStrippedSchemaTypes(schema: Schema): SchemaDefinitionish[] {
  const schemaDef = schema._original || {types: []}
  return schemaDef.types.map((type) => stripType(type))
}

function stripType(input: unknown): SchemaDefinitionish {
  return strip(input) as SchemaDefinitionish
}

function strip(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => strip(item)).filter((item) => typeof item !== 'undefined')
  }

  if (isPlainishObject(input)) {
    return Object.keys(input).reduce(
      (stripped, key) => {
        stripped[key] = strip(input[key])
        return stripped
      },
      {} as Record<string, unknown>,
    )
  }

  return isBasicType(input) ? input : undefined
}

function isPlainishObject(input: unknown): input is Record<string, unknown> {
  return isPlainObject(input)
}

function isBasicType(input: unknown): boolean {
  const type = typeof input
  if (type === 'boolean' || type === 'number' || type === 'string') {
    return true
  }

  if (type !== 'object') {
    return false
  }

  return Array.isArray(input) || input === null || isPlainishObject(input)
}
