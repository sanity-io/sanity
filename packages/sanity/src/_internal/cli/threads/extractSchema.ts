import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {extractSchema} from '@sanity/schema/_internal'
import {type SchemaType} from 'groq-js'
import {type SchemaTypeDefinition, type Workspace} from 'sanity'

import {extractWorkspace} from '../../manifest/extractManifest'
import {getStudioWorkspaces} from '../util/getStudioWorkspaces'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'

const formats = ['direct', 'groq-type-nodes'] as const
type Format = (typeof formats)[number]

/** @internal */
export interface ExtractSchemaWorkerData {
  workDir: string
  workspaceName?: string
  enforceRequiredFields?: boolean
  format: Format | string
}

type WorkspaceTransformer = (workspace: Workspace) => ExtractSchemaWorkerResult

const workspaceTransformers: Record<Format, WorkspaceTransformer> = {
  // @ts-expect-error FIXME
  'direct': extractWorkspace,
  'groq-type-nodes': (workspace) => ({
    schema: extractSchema(workspace.schema, {
      enforceRequiredFields: opts.enforceRequiredFields,
    }),
  }),
}

/** @internal */
export type ExtractSchemaWorkerResult<TargetFormat extends Format = Format> = {
  'direct': Pick<Workspace, 'name' | 'dataset'> & {schema: SchemaTypeDefinition[]}
  'groq-type-nodes': {schema: SchemaType}
}[TargetFormat]

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

const opts = _workerData as ExtractSchemaWorkerData
const {format} = opts
const cleanup = mockBrowserEnvironment(opts.workDir)

async function main() {
  try {
    if (!isFormat(format)) {
      throw new Error(`Unsupported format: "${format}"`)
    }

    const workspaces = await getStudioWorkspaces({basePath: opts.workDir})

    const postWorkspace = (workspace: Workspace): void => {
      const transformer = workspaceTransformers[format]
      parentPort?.postMessage(transformer(workspace))
    }

    if (opts.workspaceName) {
      const workspace = getWorkspace({workspaces, workspaceName: opts.workspaceName})
      postWorkspace(workspace)
    } else {
      for (const workspace of workspaces) {
        postWorkspace(workspace)
      }
    }
  } finally {
    parentPort?.close()
    cleanup()
  }
}

main()

function getWorkspace({
  workspaces,
  workspaceName,
}: {
  workspaces: Workspace[]
  workspaceName?: string
}): Workspace {
  if (workspaces.length === 0) {
    throw new Error('No studio configuration found')
  }

  if (workspaces.length === 1) {
    return workspaces[0]
  }

  const workspace = workspaces.find((w) => w.name === workspaceName)
  if (!workspace) {
    throw new Error(`Could not find workspace "${workspaceName}"`)
  }
  return workspace
}

function isFormat(maybeFormat: string): maybeFormat is Format {
  return formats.includes(maybeFormat as Format)
}
