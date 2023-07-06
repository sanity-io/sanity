/* eslint-disable no-console */
import {chromium, Page} from 'playwright'
import {concatMap, from, lastValueFrom, range} from 'rxjs'
import {tap, toArray} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {BrowserContext} from '@playwright/test'
import {capitalize} from 'lodash'
import {Deployment, PerformanceTestProps} from './types'
import {createSanitySessionCookie} from './utils/createSanitySessionCookie'
import {bundle} from './utils/bundlePerfHelpers'
import {getDeviceInfo} from './utils/getDeviceInfo'

interface RunCompareOptions {
  deployments: Deployment[]
  test: PerformanceTestProps
  page: Page
  context: BrowserContext
  client: SanityClient
  token: string
  iterations: number
}

type Result<T> = {type: 'success'; value: T} | {type: 'error'; error: Error}

async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return {type: 'success', value: await fn()}
  } catch (err: unknown) {
    return {type: 'error', error: err instanceof Error ? err : new Error(String(err))}
  }
}

async function runAgainstUrl(
  url: string,
  options: Omit<RunCompareOptions, 'deployments' | 'iterations'>
) {
  console.info(`Running "${options.test.name}" against ${url}`)
  const {context, test, client, page, token} = options

  // Add the cookie to our context
  await context.addCookies([createSanitySessionCookie(client.config().projectId!, token)])

  const testContext = {url: url, page, client}
  const {data, teardown} = await (test.setup
    ? test.setup(testContext)
    : {data: undefined, teardown: false})

  const result = await tryCatch(() => test.run({...testContext, setupData: data}))
  if (typeof teardown === 'function') {
    try {
      await teardown()
      console.info(`Done`)
    } catch (teardownError) {
      console.error(`Teardown of test "${test.id}" failed: ${teardownError.stack}`)
    }
  }
  console.info(`${capitalize(result.type)}: ${test.id}`)
  console.info()
  return result
}

function runCompare(options: RunCompareOptions) {
  const {deployments, iterations, ...rest} = options
  return lastValueFrom(
    range(iterations).pipe(
      concatMap((iteration) => {
        return from(deployments).pipe(
          concatMap(async (deployment, i) => {
            const testResult = await runAgainstUrl(deployment.url, rest)
            if (testResult.type === 'error') {
              return {
                _key: `${deployment._id}_${iteration}_${i}`,
                _type: 'error',
                message: testResult.error.message,
                stack: testResult.error.stack,
              }
            }
            return {
              _key: `${deployment._id}_${iteration}_${i}`,
              _type: 'success',
              deployment: {_ref: deployment._id},
              measurements: Object.entries(testResult.value).map(([metricName, value]) => ({
                _key: metricName,
                metric: metricName,
                value: value,
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
  testIds,
  excludeTestIds,
  registerHelpersFile,
  headless,
  iterations = 1,
  token,
}: {
  studioMetricsClient: SanityClient
  perfStudioClient: SanityClient
  deployments: Deployment[]
  testFiles: string[]
  testIds?: string[]
  excludeTestIds?: string[]
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

  const givenIds = [...(testIds || []), ...(excludeTestIds || [])]
  if (givenIds.length > 0) {
    // make sure that the test ids are valid
    givenIds.forEach((testId) => {
      if (!testModules.some((testModule) => testModule.id === testId)) {
        throw new Error(
          `Invalid test id: "${testId}". Use yarn perf:test --list to see all tests ids`
        )
      }
    })
  }
  const tests = testModules.filter(
    (testModule) =>
      (!testIds || testIds.includes(testModule.id)) && !excludeTestIds?.includes(testModule.id)
  )
  // Start by syncing test documents
  await Promise.all(
    tests.map((test) =>
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
    from(Object.values(tests)).pipe(
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
      tap(console.log)
    )
  )

  // Save the results in metrics studio
  await studioMetricsClient.create({
    _type: 'performanceTestRun',
    ci: Boolean(process.env.CI),
    device: getDeviceInfo(),
    deployments: deployments.map((deployment) => ({
      _key: deployment.deploymentId,
      _type: 'reference',
      _ref: deployment._id,
    })),
    testResults,
  })

  await context.close()
  await browser.close()
}
