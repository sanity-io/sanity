import os from 'os'
import {chromium, Page} from 'playwright'
import {from, lastValueFrom} from 'rxjs'
import {mergeMap, tap, toArray} from 'rxjs/operators'
import {createClient, SanityClient} from '@sanity/client'
import {BrowserContext} from '@playwright/test'
import globby from 'globby'
import {PerformanceTestProps} from './types'
import {getEnv} from './utils/env'
import {createSanitySessionCookie} from './utils/createSanitySessionCookie'
import {STUDIO_DATASET, STUDIO_PROJECT_ID} from './config'
import {bundle} from './utils/bundlePerfHelpers'
import {ALL_FIELDS, getCurrentBranch, getGitInfo} from './utils/gitUtils'

const BASE_BRANCH_URL = 'https://performance-studio.sanity.build'
const CURRENT_BRANCH_URL = process.env.BRANCH_DEPLOYMENT_URL || 'http://localhost:3300'

function getRepoInfo() {
  const currentBranchPromise = getEnv('CURRENT_BRANCH', true) || getCurrentBranch()
  return Promise.all([getGitInfo(ALL_FIELDS), currentBranchPromise]).then(
    ([gitInfo, currentBranch]) => ({
      ...gitInfo,
      currentBranch,
    })
  )
}

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

const studioMetricsClient = createClient({
  projectId: 'c1zuxvqn',
  dataset: 'production',
  token: getEnv('PERF_TEST_METRICS_TOKEN'),
  apiVersion: '2023-02-03',
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

  const results = await lastValueFrom(
    from(tests).pipe(
      mergeMap(async (testModule, index) => {
        const test = (await import(testModule)).default

        const result = await runCompare({
          baseBranchUrl: BASE_BRANCH_URL,
          currentBranchUrl: CURRENT_BRANCH_URL,
          test,
          page,
          client: sanityClient,
          context,
        })

        return {name: test.name, ...result, _key: `${index}`}
      }, 1),
      toArray(),
      // eslint-disable-next-line no-console
      tap(console.log)
    )
  )

  function getMachineInfo() {
    const [avg1m, avg5m, avg10m] = os.loadavg()
    return {
      type: os.type(),
      platform: os.platform(),
      version: os.version(),
      hostname: os.hostname(),
      arch: os.arch(),
      memory: {total: os.totalmem(), free: os.freemem()},
      uptime: os.uptime(),
      loadavg: {avg1m, avg5m, avg10m},
    }
  }
  const repoInfo = await getRepoInfo()

  console.log('repoInfo', repoInfo)

  const gitInfo = {
    sha: repoInfo.commit,
    abbreviatedSha: repoInfo.abbreviatedCommit,
    branch: repoInfo.currentBranch,
    author: repoInfo.authorName,
    authorEmail: repoInfo.authorEmail,
    authorDate: repoInfo.authorDate,

    commitMessage: repoInfo.subject,
    committer: repoInfo.committerName,
    committerEmail: repoInfo.committerEmail,
    committerDate: repoInfo.committerDate,
    tag: repoInfo.tag,
    lastTag: repoInfo.latestOfficialTag,
  }

  // Save the results in metrics studio
  await studioMetricsClient.create({
    _type: 'performanceTest',
    baseBranchUrl: BASE_BRANCH_URL,
    workingBranchUrl: CURRENT_BRANCH_URL,
    ci: Boolean(process.env.CI),
    git: gitInfo,
    machine: getMachineInfo(),
    results,
  })

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
