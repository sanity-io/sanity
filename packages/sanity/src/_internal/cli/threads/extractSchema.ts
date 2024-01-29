import {extractSchema} from '@sanity/schema/_internal'
import {type Workspace} from 'sanity'
import {isMainThread, parentPort, workerData as _workerData} from 'worker_threads'

import {getStudioWorkspaces} from '../util/getStudioWorkspaces'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'

export interface ExtractSchemaWorkerData {
  workDir: string
  workspaceName?: string
}

export interface ExtractSchemaWorkerResult {
  schema: ReturnType<typeof extractSchema>
}

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

const opts = _workerData as ExtractSchemaWorkerData
const cleanup = mockBrowserEnvironment(opts.workDir)

async function main() {
  try {
    const workspaces = await getStudioWorkspaces({basePath: opts.workDir})

    const workspace = getWorkspace({workspaces, workspaceName: opts.workspaceName})

    const {types} = workspace.schema._original || {types: []}

    const schema = extractSchema(types)

    parentPort?.postMessage({
      schema,
    } satisfies ExtractSchemaWorkerResult)
  } finally {
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

  if (workspaceName === undefined) {
    throw new Error('Multiple workspaces configured. Please specify which workspace to use')
  }
  const workspace = workspaces.find((w) => w.name === workspaceName)
  if (!workspace) {
    throw new Error(`Could not find workspace "${workspaceName}"`)
  }
  return workspace
}
