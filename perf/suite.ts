import os from 'os'
import {chromium, Page} from 'playwright'
import {concatMap, from, lastValueFrom, map, range} from 'rxjs'
import {tap, toArray} from 'rxjs/operators'
import {createClient, SanityClient} from '@sanity/client'
import {BrowserContext} from '@playwright/test'
import globby from 'globby'
import {median, standardDeviation} from 'simple-statistics'
import {PerformanceTestProps} from './types'
import {getEnv} from './utils/env'
import {createSanitySessionCookie} from './utils/createSanitySessionCookie'
import {STUDIO_DATASET, STUDIO_PROJECT_ID} from './config'
import {bundle} from './utils/bundlePerfHelpers'
import {ALL_FIELDS, getGitInfo, parseDecoratedRefs} from './utils/gitUtils'
import {studioMetricsClient} from './config/studioMetricsClient'

const BASE_BRANCH_URL = 'https://performance-studio.sanity.build'
const CURRENT_BRANCH_URL = process.env.BRANCH_DEPLOYMENT_URL || 'http://localhost:3300'

async function getRepoInfo() {
  const gitInfo = await getGitInfo(ALL_FIELDS)
  const {branches, tags} = parseDecoratedRefs(gitInfo.refs)
  return {
    ...gitInfo,
    branches,
    tags,
  }
}

interface RunCompareOptions {
  baseBranchUrl: string
  currentBranchUrl: string
  test: PerformanceTestProps
  page: Page
  context: BrowserContext
  client: SanityClient
}

async function runAgainstUrl(url: string, options: RunCompareOptions) {
  const {context, test, client, page} = options

  // Add the cookie to our context
  await context.addCookies([
    createSanitySessionCookie(client.config().projectId!, getEnv('PERF_TEST_SANITY_TOKEN')),
  ])
  return test.run({url: url, page, client})
}

interface Measurement {
  _key: string
  diff: number
  metric: string
}
function runCompare(options: RunCompareOptions): Promise<Measurement[]> {
  const {baseBranchUrl, currentBranchUrl, test} = options
  const iterations = 4
  return lastValueFrom(
    range(iterations).pipe(
      concatMap(async (iteration) => {
        const baseBranchResult = await runAgainstUrl(baseBranchUrl, options)
        const currentBranchResult = await runAgainstUrl(currentBranchUrl, options)

        return {base: baseBranchResult, current: currentBranchResult}
      }),
      toArray(),
      map((iterationResults) => {
        return Object.entries(test.metrics).map(([metricName, metric]) => {
          // sum of all iterative measurements for this metric
          const current = iterationResults.map((iteration) => iteration.current[metricName])
          const base = iterationResults.map((iteration) => iteration.base[metricName])

          const baseMedian = median(base)
          const currentMedian = median(current)

          return {
            _key: metricName,
            metric: metricName,
            iterations: current.map((c, i) => ({current: c, base: base[i], _key: `${i}`})),
            stdDev: standardDeviation(base.concat(current)),
            median: {base: baseMedian, current: currentMedian},
            diff: currentMedian / baseMedian,
          }
        })
      })
    )
  )
}

export const sanityClient = createClient({
  projectId: STUDIO_PROJECT_ID,
  dataset: STUDIO_DATASET,
  token: getEnv('PERF_TEST_SANITY_TOKEN'),
  apiVersion: '2023-02-03',
  useCdn: false,
})

async function runSuite() {
  const testFiles = await globby(`${__dirname}/tests/**/*.test.ts`)

  const testModules = await Promise.all(
    testFiles.map((testModule) =>
      import(testModule).then((module) => module.default as PerformanceTestProps)
    )
  )
  // Start by creating or updating test documents
  await Promise.all(
    testModules.map((test) =>
      studioMetricsClient.createOrReplace({
        _id: `test-${test.id}-${test.version}`,
        _type: 'performanceTest',
        name: test.name,
        metrics: Object.entries(test.metrics).map(([name, metric]) => ({
          _key: name,
          id: name,
          title: metric.title,
          description: metric.description,
        })),
        version: test.version,
        description: test.description,
      })
    )
  )
  const browser = await chromium.launch({
    headless: Boolean(getEnv('PERF_TEST_HEADLESS', true)) === false,
  })
  const context = await browser.newContext()
  const bundleHelpers = await bundle(require.resolve(`${__dirname}/helpers/register.ts`))
  const page = await context.newPage()
  await page.addInitScript({content: bundleHelpers})

  const testResults = await lastValueFrom(
    from(Object.values(testModules)).pipe(
      concatMap(async (test) => {
        const measurements = await runCompare({
          baseBranchUrl: BASE_BRANCH_URL,
          currentBranchUrl: CURRENT_BRANCH_URL,
          test,
          page,
          client: sanityClient,
          context,
        })

        return {
          _key: test.id,
          measurements,
          test: {_type: 'reference', _ref: `test-${test.id}-${test.version}`},
        }
      }),
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

  const gitInfo = {
    sha: repoInfo.commit,
    abbreviatedSha: repoInfo.abbreviatedCommit,
    branches: repoInfo.branches,
    tags: repoInfo.tags,
    parent: repoInfo.parent,
    abbreviatedParent: repoInfo.abbreviatedParent,
    author: repoInfo.authorName,
    authorEmail: repoInfo.authorEmail,
    authorDate: repoInfo.authorDate,

    commitMessage: repoInfo.subject,
    committer: repoInfo.committerName,
    committerEmail: repoInfo.committerEmail,
    committerDate: repoInfo.committerDate,
    tag: repoInfo.tag,
    currentTag: repoInfo.currentTag,
  }

  // Save the results in metrics studio
  await studioMetricsClient.create({
    _type: 'performanceTestRun',
    baseBranchUrl: BASE_BRANCH_URL,
    workingBranchUrl: CURRENT_BRANCH_URL,
    ci: Boolean(process.env.CI),
    git: gitInfo,
    machine: getMachineInfo(),
    testResults,
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
