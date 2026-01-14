import fs from 'node:fs'
import path from 'node:path'

import {type SanityClient} from '@sanity/client'
import {type Browser, chromium} from 'playwright'

import {type EfpsResult, type EfpsTest, type EfpsTestRunnerContext} from './types'

interface RunTestOptions {
  /** Optional browser instance to reuse. If not provided, a new browser will be launched. */
  browser?: Browser
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
  browser: existingBrowser,
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

  let browser: Browser | undefined
  let document
  let context
  const shouldCloseBrowser = !existingBrowser

  try {
    if (existingBrowser) {
      browser = existingBrowser
    } else {
      log('Launching browser…')
      browser = await chromium.launch({
        headless,
        args: ['--disable-gpu', '--disable-software-rasterizer'],
      })
    }
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
      {waitUntil: 'domcontentloaded', timeout: 60_000},
    )

    // Wait for the form view to be visible and editable, indicating the studio has fully loaded
    await page.locator('[data-testid="form-view"]').waitFor({state: 'visible', timeout: 60_000})
    await page
      .locator('[data-testid="form-view"]:not([data-read-only="true"])')
      .waitFor({state: 'visible', timeout: 60_000})

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
    // Only close the browser if we created it (not if it was passed in for reuse)
    if (shouldCloseBrowser) {
      await browser?.close()
    }

    if (document) {
      await Promise.allSettled([
        client.delete(document._id),
        client.delete(`drafts.${document._id}`),
      ])
    }
  }
}

/**
 * Creates a reusable browser instance for running multiple tests.
 * The caller is responsible for closing the browser when done.
 */
export async function createBrowser(headless: boolean): Promise<Browser> {
  return chromium.launch({
    headless,
    args: ['--disable-gpu', '--disable-software-rasterizer'],
  })
}
