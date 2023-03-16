import {chromium, Page} from 'playwright'
import {concatMap, from, lastValueFrom, range} from 'rxjs'
import {tap, toArray} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {BrowserContext} from '@playwright/test'
import {PerformanceTestProps} from './types'
import {createSanitySessionCookie} from './utils/createSanitySessionCookie'
import {bundle} from './utils/bundlePerfHelpers'
import {getDeviceInfo} from './utils/getDeviceInfo'

interface Deployment {
  id: string
  url: string
  label: string
}

interface RunCompareOptions {
  deployments: Deployment[]
  test: PerformanceTestProps
  page: Page
  context: BrowserContext
  client: SanityClient
  token: string
  iterations: number
}

async function runAgainstUrl(
  url: string,
  options: Omit<RunCompareOptions, 'deployments' | 'iterations'>
) {
  const {context, test, client, page, token} = options

  // Add the cookie to our context
  await context.addCookies([createSanitySessionCookie(client.config().projectId!, token)])

  const testContext = {url: url, page, client}
  const {data, teardown} = await (test.setup
    ? test.setup(testContext)
    : {data: undefined, teardown: false})

  const result = await test.run({...testContext, setupData: data})
  if (typeof teardown === 'function') {
    await teardown()
  }
  return result
}

function runCompare(options: RunCompareOptions) {
  const {deployments, iterations, ...rest} = options
  return lastValueFrom(
    range(iterations).pipe(
      concatMap((iteration) => {
        return from(deployments).pipe(
          concatMap(async (deployment, i) => {
            const results = await runAgainstUrl(deployment.url, rest)
            return {
              _key: `${deployment.id}_${iteration}_${i}`,
              deployment: {_ref: deployment.id},
              measurements: Object.entries(results).map(([metricName, result]) => ({
                _key: metricName,
                metric: metricName,
                value: result,
              })),
            }
          })
        )
      }),
      toArray()
    )
  )
}
export async function run({
  studioMetricsClient,
  perfStudioClient,
  deployments,
  testFiles,
  registerHelpersFile,
  headless,
  iterations = 1,
  token,
}: {
  studioMetricsClient: SanityClient
  perfStudioClient: SanityClient
  deployments: Deployment[]
  testFiles: string[]
  registerHelpersFile: string
  headless?: boolean
  iterations?: number
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
        const iterationResults = await runCompare({
          deployments,
          iterations,
          test,
          page,
          client: perfStudioClient,
          context,
          token,
        })

        return {
          _key: test.id,
          iterations: iterationResults,
          test: {_type: 'reference', _ref: `test-${test.id}-${test.version}`},
        }
      }),
      toArray(),
      // eslint-disable-next-line no-console
      tap(console.log)
    )
  )

  // Save the results in metrics studio
  await studioMetricsClient.create({
    _type: 'performanceTestRun',
    ci: Boolean(process.env.CI),
    device: getDeviceInfo(),
    deployments: deployments.map((d) => ({_key: d.id, _type: 'reference', _ref: d.id})),
    testResults,
  })

  await context.close()
  await browser.close()
}
