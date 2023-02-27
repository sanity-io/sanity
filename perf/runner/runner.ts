import {chromium, Page} from 'playwright'
import {concatMap, from, lastValueFrom, map, range} from 'rxjs'
import {tap, toArray} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {BrowserContext} from '@playwright/test'
import {PerformanceTestProps} from './types'
import {createSanitySessionCookie} from './utils/createSanitySessionCookie'
import {bundle} from './utils/bundlePerfHelpers'
import {ALL_FIELDS, getGitInfo, parseDecoratedRefs} from './utils/gitUtils'
import {getMachineInfo} from './utils/getMachineInfo'

const BASE_BRANCH_URL = 'https://performance-studio.sanity.build'
const CURRENT_BRANCH_URL = process.env.BRANCH_DEPLOYMENT_URL || 'http://localhost:3300'

interface RunCompareOptions {
  baseBranchUrl: string
  currentBranchUrl: string
  test: PerformanceTestProps
  page: Page
  context: BrowserContext
  client: SanityClient
  token: string
}

async function runAgainstUrl(url: string, options: RunCompareOptions) {
  const {context, test, client, page, token} = options

  // Add the cookie to our context
  await context.addCookies([createSanitySessionCookie(client.config().projectId!, token)])
  return test.run({url: url, page, client})
}

interface Measurement {
  _key: string
  diff: number
  metric: string
}
function runCompare(options: RunCompareOptions): Promise<Measurement[]> {
  const {baseBranchUrl, currentBranchUrl, test} = options
  const iterations = 6
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

          const baseMin = Math.min(...base)
          const currentMin = Math.min(...current)

          return {
            _key: metricName,
            metric: metricName,
            iterations: current.map((c, i) => ({current: c, base: base[i], _key: `${i}`})),
            min: {base: baseMin, current: currentMin},
            diff: currentMin / baseMin,
          }
        })
      })
    )
  )
}

export async function run({
  studioMetricsClient,
  perfStudioClient,
  testFiles,
  registerHelpersFile,
  headless,
  token,
}: {
  studioMetricsClient: SanityClient
  perfStudioClient: SanityClient
  testFiles: string[]
  registerHelpersFile: string
  headless?: boolean
  token: string
}) {
  const testModules = await Promise.all(
    testFiles.map((testModule) =>
      import(testModule).then((module) => module.default as PerformanceTestProps)
    )
  )
  // Start by syncing test documents
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
    headless,
  })
  const context = await browser.newContext()
  const bundleHelpers = await bundle(registerHelpersFile)
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
          client: perfStudioClient,
          context,
          token,
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

  const repoInfo = await getRepoInfo()

  // Save the results in metrics studio
  await studioMetricsClient.create({
    _type: 'performanceTestRun',
    baseBranchUrl: BASE_BRANCH_URL,
    workingBranchUrl: CURRENT_BRANCH_URL,
    ci: Boolean(process.env.CI),
    git: {
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
    },
    machine: getMachineInfo(),
    testResults,
  })

  await context.close()
  await browser.close()
}

async function getRepoInfo() {
  const gitInfo = await getGitInfo(ALL_FIELDS)
  const {branches, tags} = parseDecoratedRefs(gitInfo.refs)
  return {
    ...gitInfo,
    branches,
    tags,
  }
}
