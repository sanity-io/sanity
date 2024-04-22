import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {extractSchema} from '@sanity/schema/_internal'
import {type Workspace} from 'sanity'

import {getStudioWorkspaces} from '../util/getStudioWorkspaces'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'

/** @internal */
export interface ExtractSchemaWorkerData {
  workDir: string
  workspaceName?: string
  enforceRequiredFields?: boolean
  format: 'groq-type-nodes' | string
}

/** @internal */
export interface ExtractSchemaWorkerResult extends Pick<Workspace, 'name' | 'dataset'> {
  schema: ReturnType<typeof extractSchema>
}

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

const opts = _workerData as ExtractSchemaWorkerData
const cleanup = mockBrowserEnvironment(opts.workDir)

async function main() {
  try {
    if (opts.format !== 'groq-type-nodes') {
      throw new Error(`Unsupported format: "${opts.format}"`)
    }

    const workspaces = await getStudioWorkspaces({basePath: opts.workDir})

    const postWorkspace = (workspace: Workspace): void => {
      parentPort?.postMessage({
        name: workspace.name,
        dataset: workspace.dataset,
        schema: extractSchema(workspace.schema, {
          enforceRequiredFields: opts.enforceRequiredFields,
        }),
      } satisfies ExtractSchemaWorkerResult)
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
