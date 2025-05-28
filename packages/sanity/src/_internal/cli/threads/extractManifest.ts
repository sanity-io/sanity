import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {extractCreateWorkspaceManifest} from '../../manifest/extractWorkspaceManifest'
import {getStudioWorkspaces} from '../util/getStudioWorkspaces'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'

/** @internal */
export interface ExtractManifestWorkerData {
  workDir: string
}

async function main() {
  if (isMainThread || !parentPort) {
    throw new Error('This module must be run as a worker thread')
  }

  const opts = _workerData as ExtractManifestWorkerData

  const cleanup = mockBrowserEnvironment(opts.workDir)

  try {
    const workspaces = await getStudioWorkspaces({basePath: opts.workDir})

    for (const workspace of workspaces) {
      parentPort?.postMessage(extractCreateWorkspaceManifest(workspace))
    }
  } finally {
    parentPort?.close()
    cleanup()
  }
}

main().then(() => process.exit())
