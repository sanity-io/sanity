import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {extractCreateWorkspaceManifest} from '@sanity/schema/_internal'

import {resolveIcon} from '../../manifest/resolveIcon'
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

  const opts = _workerData

  if (!isExtractManifestWorkerData(opts)) {
    throw new Error('Invalid worker data: expected an object with a "workDir" string property')
  }

  const cleanup = mockBrowserEnvironment(opts.workDir)

  try {
    const workspaces = await getStudioWorkspaces({basePath: opts.workDir})

    const pending: Promise<void>[] = []
    for (const workspace of workspaces) {
      pending.push(
        extractCreateWorkspaceManifest(workspace, resolveIcon).then((manifest) =>
          parentPort?.postMessage(manifest),
        ),
      )
    }
    await Promise.all(pending)
  } finally {
    parentPort?.close()
    cleanup()
  }
}

function isExtractManifestWorkerData(data: unknown): data is ExtractManifestWorkerData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'workDir' in data &&
    typeof data.workDir === 'string'
  )
}

void main().then(() => process.exit())
