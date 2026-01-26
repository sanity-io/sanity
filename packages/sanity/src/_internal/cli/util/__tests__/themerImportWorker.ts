import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {mockBrowserEnvironment} from '../mockBrowserEnvironment'

export type ThemerImportWorkerData = {
  workDir: string
  importName: string
}

const {workDir, importName} = _workerData satisfies ThemerImportWorkerData

async function main() {
  if (isMainThread || !parentPort) {
    throw new Error('This module must be run as a worker thread')
  }

  const cleanup = mockBrowserEnvironment(workDir)

  try {
    // eslint-disable-next-line import/no-dynamic-require
    require(importName)

    // If we get here, the import was handled successfully
    parentPort?.postMessage({success: true})
  } catch (error) {
    // If we catch an error, the import error handler didn't work
    parentPort?.postMessage({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    cleanup()
  }
}

void main().then(() => process.exit())
