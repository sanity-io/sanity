import fs from 'node:fs'
import {createServer} from 'node:http'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {type SanityClient} from '@sanity/client'
import react from '@vitejs/plugin-react'
import {chromium} from 'playwright'
import sourcemaps from 'rollup-plugin-sourcemaps'
import handler from 'serve-handler'
import * as vite from 'vite'

import {remapCpuProfile} from './helpers/remapCpuProfile'
import {type EfpsResult, type EfpsTest, type EfpsTestRunnerContext} from './types'

const workspaceDir = path.dirname(fileURLToPath(import.meta.url))

interface RunTestOptions {
  client: SanityClient
  enableProfiler: boolean
  headless: boolean
  key: string
  log: (text: string) => void
  projectId: string
  recordVideo: boolean
  resultsDir: string
  sanityPkgPath: string
  test: EfpsTest
}

export async function runTest({
  client,
  enableProfiler,
  headless,
  key,
  log,
  projectId,
  recordVideo,
  resultsDir,
  sanityPkgPath,
  test,
}: RunTestOptions): Promise<EfpsResult[]> {
  const outDir = path.join(workspaceDir, 'builds', test.name, key)
  const testResultsDir = path.join(resultsDir, test.name, key)

  await fs.promises.mkdir(outDir, {recursive: true})
  log('Building…')

  const alias: Record<string, string> = {
    '#config': fileURLToPath(test.configPath!),
    'sanity': sanityPkgPath,
  }

  await vite.build({
    appType: 'spa',
    build: {outDir, sourcemap: true},
    plugins: [
      {...sourcemaps(), enforce: 'pre'},
      react({
        babel: {plugins: [['babel-plugin-react-compiler', {target: '18'}]]},
      }),
    ],
    resolve: {alias},
    logLevel: 'silent',
  })

  log('Starting server…')
  const server = createServer((req, res) => {
    handler(req, res, {
      rewrites: [{source: '**', destination: '/index.html'}],
      public: outDir,
    })
  })

  await new Promise<void>((resolve) => server.listen(3300, resolve))

  let browser
  let document
  let context

  try {
    log('Launching browser…')
    browser = await chromium.launch({headless})
    context = await browser.newContext({
      recordVideo: recordVideo ? {dir: testResultsDir} : undefined,
      storageState: {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:3300',
            localStorage: [
              {
                name: `__studio_auth_token_${projectId}`,
                value: JSON.stringify({
                  token: client.config().token,
                  time: new Date().toISOString(),
                }),
              },
            ],
          },
        ],
      },
    })

    const page = await context.newPage()

    const runnerContext: EfpsTestRunnerContext = {browser, context, page, client}

    log('Creating test document…')
    const documentToCreate =
      typeof test.document === 'function' ? await test.document(runnerContext) : test.document
    document = await client.create(documentToCreate)

    const cdp = enableProfiler ? await context.newCDPSession(page) : null

    log('Loading editor…')
    await page.goto(
      `http://localhost:3300/intent/edit/id=${encodeURIComponent(
        document._id,
      )};type=${encodeURIComponent(documentToCreate._type)}`,
    )

    if (cdp) {
      await cdp.send('Profiler.enable')
      await cdp.send('Profiler.start')
    }

    log('Benchmarking…')
    const result = await test.run({...runnerContext, document})

    log('Saving results…')
    const results = Array.isArray(result) ? result : [result]

    await fs.promises.mkdir(testResultsDir, {recursive: true})
    await fs.promises.writeFile(
      path.join(testResultsDir, 'results.json'),
      JSON.stringify(results, null, 2),
    )

    if (cdp) {
      const {profile} = await cdp.send('Profiler.stop')
      await fs.promises.writeFile(
        path.join(testResultsDir, 'raw.cpuprofile'),
        JSON.stringify(profile),
      )
      const remappedProfile = await remapCpuProfile(profile, outDir)
      await fs.promises.writeFile(
        path.join(testResultsDir, 'mapped.cpuprofile'),
        JSON.stringify(remappedProfile),
      )
    }

    return results
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    )

    await context?.close()
    await browser?.close()

    if (document) {
      await Promise.allSettled([
        client.delete(document._id),
        client.delete(`drafts.${document._id}`),
      ])
    }
  }
}
