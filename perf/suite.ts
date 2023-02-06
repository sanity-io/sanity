import {chromium, Page} from 'playwright'
import {from, lastValueFrom} from 'rxjs'
import {mergeMap, tap} from 'rxjs/operators'
import createClient, {SanityClient} from '@sanity/client'
import {BrowserContext} from '@playwright/test'
import globby from 'globby'
import {PerformanceTestProps} from './types'
import {getEnv} from './utils/env'
import {createSanitySessionCookie} from './utils/createSanitySessionCookie'
import {STUDIO_DATASET, STUDIO_PROJECT_ID} from './config'
import {bundle} from './utils/bundlePerfHelpers'

const BASE_BRANCH_URL = 'https://performance-studio.sanity.build'
const CURRENT_BRANCH_URL = process.env.BRANCH_DEPLOYMENT_URL || 'http://localhost:3300'

interface RunCompareOptions {
  baseBranchUrl: string
  currentBranchUrl: string
  test: PerformanceTestProps
  page: Page
  context: BrowserContext
  client: SanityClient
}

async function runAgainstUrl(options: RunCompareOptions & {url: string}) {
  const {url, context, test, client, page} = options

  // Add the cookie to our context
  await context.addCookies([
    createSanitySessionCookie(client.config().projectId!, getEnv('PERF_TEST_SANITY_TOKEN')),
  ])
  return test.run({url: url, page, client})
}

async function runCompare(
  options: RunCompareOptions
): Promise<{base: number; current: number; diff: number}> {
  const {baseBranchUrl, currentBranchUrl} = options

  const baseBranchResultIteration1 = await runAgainstUrl({
    ...options,
    url: baseBranchUrl,
  })
  const currentBranchResultIteration1 = await runAgainstUrl({
    ...options,
    url: currentBranchUrl,
  })

  const baseBranchResultIteration2 = await runAgainstUrl({
    ...options,
    url: baseBranchUrl,
  })
  const currentBranchResultIteration2 = await runAgainstUrl({
    ...options,
    url: currentBranchUrl,
  })

  const baseBranchResult =
    (baseBranchResultIteration1.result + baseBranchResultIteration2.result) / 2

  const currentBranchResult =
    (currentBranchResultIteration1.result + currentBranchResultIteration2.result) / 2

  return {
    diff: currentBranchResult - baseBranchResult,
    base: baseBranchResult,
    current: currentBranchResult,
  }
}

export const sanityClient = createClient({
  projectId: STUDIO_PROJECT_ID,
  dataset: STUDIO_DATASET,
  token: getEnv('PERF_TEST_SANITY_TOKEN'),
  apiVersion: '2023-02-03',
  useCdn: false,
})

async function runSuite() {
  const tests = await globby(`${__dirname}/tests/**/*.test.ts`)

  const browser = await chromium.launch({
    headless: Boolean(getEnv('PERF_TEST_HEADLESS', true)) === false,
  })
  const context = await browser.newContext()
  const bundleHelpers = await bundle(require.resolve(`${__dirname}/helpers/register.ts`))
  const page = await context.newPage()
  await page.addInitScript({content: bundleHelpers})

  await lastValueFrom(
    from(tests).pipe(
      mergeMap(async (testModule) => {
        const test = (await import(testModule)).default
        return runCompare({
          baseBranchUrl: BASE_BRANCH_URL,
          currentBranchUrl: CURRENT_BRANCH_URL,
          test,
          page,
          client: sanityClient,
          context,
        })
      }, 1),
      // eslint-disable-next-line no-console
      tap(console.log)
    )
  )

  await context.close()
  await browser.close()
}

runSuite().then(
  () => {
    // eslint-disable-next-line no-console
    console.log('Ran performance test suite')
  },
  (err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  }
)
