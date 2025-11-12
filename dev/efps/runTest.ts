import fs from 'node:fs'
import path from 'node:path'

import {type SanityClient} from '@sanity/client'
import {chromium} from 'playwright'

import {type EfpsResult, type EfpsTest, type EfpsTestRunnerContext} from './types'

interface RunTestOptions {
  client: SanityClient
  enableProfiler: boolean
  headless: boolean
  key: string
  log: (text: string) => void
  recordVideo: boolean
  resultsDir: string
  studioUrl: string
  test: EfpsTest
}

export async function runTest({
  client,
  enableProfiler,
  headless,
  key,
  log,
  recordVideo,
  resultsDir,
  studioUrl,
  test,
}: RunTestOptions): Promise<EfpsResult[]> {
  const testResultsDir = path.join(resultsDir, test.name, key)

  let browser
  let document
  let context

  try {
    log('Launching browser…')
    browser = await chromium.launch({
      headless,
      args: ['--disable-gpu', '--disable-software-rasterizer'],
    })
    context = await browser.newContext({
      recordVideo: recordVideo ? {dir: testResultsDir} : undefined,
      reducedMotion: 'reduce',
      storageState: {
        cookies: [],
        origins: [
          {
            origin: studioUrl,
            localStorage: [
              {
                name: `__studio_auth_token_${client.config().projectId}`,
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
      `${studioUrl}/${test.name}/intent/edit/id=${encodeURIComponent(
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

      await fs.promises.writeFile(
        path.join(testResultsDir, 'mapped.cpuprofile'),
        JSON.stringify(profile),
      )
    }

    return results
  } finally {
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
