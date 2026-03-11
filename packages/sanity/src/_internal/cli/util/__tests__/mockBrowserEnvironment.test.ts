import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {Worker} from 'node:worker_threads'

import {describe, expect, test} from 'vitest'

import {type EsmJsImportWorkerData} from './esmJsImportWorker'
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

  test('should resolve .js imports to .ts files (ESM-style TypeScript imports)', async () => {
    // This reproduces the issue from GitHub #12125 where `sanity deploy` fails
    // because user config files use ESM-style .js extensions to import .ts files
    // e.g., `import { schema } from './schemas/index.js'` where the file is actually `index.ts`
    const fixtureDir = fileURLToPath(new URL('./fixtures/esm-js-imports', import.meta.url))
    const configPath = path.join(fixtureDir, 'config.ts')

    const workerData: EsmJsImportWorkerData = {
      workDir: fixtureDir,
      configPath,
    }

    const workerFilepath = fileURLToPath(new URL('./esmJsImportWorker.ts', import.meta.url))

    const worker = new Worker(
      `
        const { register } = require('esbuild-register/dist/node')

        const { unregister } = register({
          target: 'node18',
          format: 'cjs',
          extensions: ['.ts'],
        })

        require(${JSON.stringify(workerFilepath)})
      `,
      {eval: true, workerData},
    )

    const result = await new Promise<{success: boolean; error?: string; config?: any}>(
      (resolve, reject) => {
        worker.on('message', resolve)
        worker.on('error', reject)
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`))
          }
        })
      },
    )

    expect(result).toEqual({
      success: true,
      config: {
        name: 'test',
        schema: {
          types: [{name: 'post', type: 'document', fields: [{name: 'title', type: 'string'}]}],
        },
      },
    })
  })
})
