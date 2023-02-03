import {chromium, Page} from 'playwright'
import {from, lastValueFrom} from 'rxjs'
import {mergeMap, tap} from 'rxjs/operators'
import createClient, {SanityClient} from '@sanity/client'
import {BrowserContext} from '@playwright/test'
import * as tests from './tests'
import {PerformanceTestProps} from './types'
import {getEnv} from './utils/env'

// eslint-disable-next-line import/no-unassigned-import
require('dotenv/config')

const BASE_BRANCH_URL = 'https://test-studio.sanity.build'
const CURRENT_BRANCH_URL = process.env.BRANCH_DEPLOYMENT_URL || 'http://localhost:3333'

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
  const domain = new URL(client.getUrl('/')).hostname
  await context.addCookies([
    {
      name: 'sanitySession',
      value: getEnv('PERF_TEST_SANITY_TOKEN'),
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      domain: `.${domain}`,
      path: '/',
    },
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

const client = createClient({
  projectId: 'ppsg7ml5',
  dataset: 'test',
  token: getEnv('PERF_TEST_SANITY_TOKEN'),
  apiVersion: '2023-02-03',
  useCdn: false,
})
async function runSuite() {
  const browser = await chromium.launch({headless: false})
  const context = await browser.newContext()
  const page = await context.newPage()

  await lastValueFrom(
    from(Object.entries(tests)).pipe(
      mergeMap(([name, test]) => {
        return runCompare({
          baseBranchUrl: BASE_BRANCH_URL,
          currentBranchUrl: CURRENT_BRANCH_URL,
          test,
          page,
          client,
          context,
        })
      }, 1),
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
