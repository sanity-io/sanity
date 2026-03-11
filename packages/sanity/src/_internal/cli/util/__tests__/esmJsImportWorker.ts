import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {mockBrowserEnvironment} from '../mockBrowserEnvironment'

export type EsmJsImportWorkerData = {
  workDir: string
  configPath: string
}

const {workDir, configPath} = _workerData satisfies EsmJsImportWorkerData

async function main() {
  if (isMainThread || !parentPort) {
    throw new Error('This module must be run as a worker thread')
  }

  const cleanup = mockBrowserEnvironment(workDir)

  try {
    // eslint-disable-next-line import/no-dynamic-require
    const mod = require(configPath)
    const config = mod.__esModule && mod.default ? mod.default : mod

    // Verify the config was loaded correctly
    parentPort?.postMessage({success: true, config})
  } catch (error) {
    parentPort?.postMessage({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    cleanup()
  }
}

void main().then(() => process.exit())
