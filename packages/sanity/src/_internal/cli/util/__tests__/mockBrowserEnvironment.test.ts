import {fileURLToPath} from 'node:url'
import {Worker} from 'node:worker_threads'

import {describe, expect, test} from 'vitest'

import {type ThemerImportWorkerData} from './themerImportWorker'

function getImportWorker(importName: string) {
  const workerData: ThemerImportWorkerData = {
    workDir: process.cwd(),
    importName,
  }

  const filepath = fileURLToPath(new URL('./themerImportWorker.ts', import.meta.url))

  const worker = new Worker(
    `
      const { register } = require('esbuild-register/dist/node')

      const { unregister } = register({
        target: 'node18',
        format: 'cjs',
        extensions: ['.ts'],
      })

      require(${JSON.stringify(filepath)})
    `,
    {eval: true, workerData},
  )

  return new Promise<{success: boolean; error?: string}>((resolve, reject) => {
    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
}

describe('mockBrowserEnvironment', () => {
  test('should handle themer.sanity.build imports in worker thread', async () => {
    await expect(getImportWorker('https://themer.sanity.build/api/hues')).resolves.toEqual({
      success: true,
    })
  })

  test('should still error on non-themer.sanity.build imports in worker thread', async () => {
    await expect(getImportWorker('https://foobar.official/package')).resolves.toEqual({
      success: false,
      error: expect.stringContaining("Cannot find module 'https://foobar.official/package'"),
    })
  })
})
