// oxlint-disable no-console
// oxlint-disable-next-line no-unassigned-import
import 'dotenv/config'

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

import {readEnv} from '@repo/utils'
import {createClient} from '@sanity/client'
import chalk from 'chalk'
import Table from 'cli-table3'
import Ora from 'ora'
import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

import {exec} from './helpers/exec'
import {readEnvVar} from './readEnvVar'
import {createBrowser, runTest} from './runTest'
import article from './tests/article/article'
import recipe from './tests/recipe/recipe'
import singleString from './tests/singleString/singleString'
import synthetic from './tests/synthetic/synthetic'
import {type EfpsAbResult, type EfpsResult, type EfpsTest} from './types'
import {formatPercentageChange, isSignificantlyDifferent} from './utils'

const TEST_ATTEMPTS = process.env.CI ? 3 : 1

// eslint-disable-next-line turbo/no-undeclared-env-vars
const HEADLESS = process.env.HEADLESS !== 'false'
// eslint-disable-next-line turbo/no-undeclared-env-vars
const ENABLE_PROFILER = process.env.ENABLE_PROFILER === 'true'

// eslint-disable-next-line turbo/no-undeclared-env-vars
const RECORD_VIDEO = process.env.RECORD_VIDEO === 'true'
const REFERENCE_STUDIO_URL = 'https://efps.sanity.dev'

const EXPERIMENT_STUDIO_URL = readEnv('STUDIO_URL')

const TESTS = [article, recipe, singleString, synthetic]

const stagingToken = readEnvVar('EFPS_SANITY_TOKEN_STAGING')
const prodToken = readEnvVar('EFPS_SANITY_TOKEN_PROD')

const referenceConfig = {
  projectId: readEnv('SANITY_STUDIO_EFPS_REFERENCE_PROJECT_ID'),
  dataset: readEnv('SANITY_STUDIO_EFPS_REFERENCE_DATASET'),
  apiHost: readEnv('SANITY_STUDIO_EFPS_REFERENCE_API_HOST'),
} as const

const experimentConfig = {
  projectId: readEnv('SANITY_STUDIO_EFPS_EXPERIMENT_PROJECT_ID'),
  dataset: readEnv('SANITY_STUDIO_EFPS_EXPERIMENT_DATASET'),
  apiHost: readEnv('SANITY_STUDIO_EFPS_EXPERIMENT_API_HOST'),
} as const

const referenceToken = referenceConfig.apiHost?.endsWith('.work') ? stagingToken : prodToken
const experimentToken = experimentConfig.apiHost?.endsWith('.work') ? stagingToken : prodToken

const workspaceDir = path.dirname(fileURLToPath(import.meta.url))
const timestamp = new Date()

const resultsDir = path.join(
  workspaceDir,
  'results',
  // e.g. run__1724188682225__8-20-2024__4-18-02pm
  // makes it sortable and still human parsable
  `run__${timestamp.getTime()}__${timestamp
    .toLocaleDateString('en-US')
    .replaceAll('/', '-')}__${timestamp
    .toLocaleTimeString('en-US')
    .replaceAll(' ', '')
    .replaceAll(':', '-')
    .toLowerCase()}`,
)

const argv = await yargs(hideBin(process.argv)).option('shard', {
  describe:
    'Shard number in the format "1/3" where 1 is the current shard and 3 is the total shards',
  type: 'string',
}).argv

// Function to parse shard argument
function parseShard(shard: string) {
  const [current, total] = shard.split('/').map(Number)
  if (!current || !total || current > total || current < 1) {
    throw new Error(`Invalid shard format: ${shard}. It should be in the format "1/3"`)
  }
  return {current, total}
}

// Function to select tests based on shard
function getTestsForShard(tests: EfpsTest[], shard: {current: number; total: number}) {
  const testsPerShard = Math.ceil(tests.length / shard.total)
  const start = (shard.current - 1) * testsPerShard
  const end = start + testsPerShard
  return tests.slice(start, end)
}

const shard = argv.shard ? parseShard(argv.shard) : null
const selectedTests = shard ? getTestsForShard(TESTS, shard) : TESTS

const formatEfps = (latencyMs: number) => {
  const efps = 1000 / latencyMs
  const rounded = efps.toFixed(1)

  if (efps >= 100) return chalk.green('99.9+')
  if (efps >= 60) return chalk.green(rounded)
  if (efps >= 20) return chalk.yellow(rounded)
  return chalk.red(rounded)
}

const spinner = Ora()

spinner.info(
  `Running ${selectedTests.length} tests: ${selectedTests.map((t) => `'${t.name}'`).join(', ')}`,
)

await exec({
  text: ['Ensuring playwright is installed…', 'Playwright is installed'],
  command: 'pnpm playwright install',
  spinner,
})

function mergeResults(baseResults: EfpsResult[] | undefined, incomingResults: EfpsResult[]) {
  if (!baseResults) return incomingResults

  return incomingResults.map((incomingResult, index) => {
    const baseResult = baseResults[index]

    const incomingMedianLatency = incomingResult.latency.p50
    const baseMedianLatency = baseResult.latency.p50

    // if the incoming test run performed better, we'll take that one
    if (incomingMedianLatency < baseMedianLatency) return incomingResult
    // otherwise, use the previous run
    return baseResult
  })
}

const testResults: Array<{
  name: string
  results: EfpsAbResult[]
}> = []

async function runAbTest(test: EfpsTest) {
  const referenceStudioClient = createClient({
    ...referenceConfig,
    token: referenceToken,
    useCdn: false,
    apiVersion: 'v2024-08-08',
  })

  const experimentStudioClient = createClient({
    ...experimentConfig,
    token: experimentToken,
    useCdn: false,
    apiVersion: 'v2024-08-08',
  })

  // Create reusable browsers for each branch
  spinner.start(`Launching browsers for test '${test.name}'...`)
  const [referenceBrowser, experimentBrowser] = await Promise.all([
    createBrowser(HEADLESS),
    createBrowser(HEADLESS),
  ])
  spinner.succeed(`Browsers launched for test '${test.name}'`)

  let referenceResults: EfpsResult[] | undefined
  let experimentResults: EfpsResult[] | undefined

  try {
    // Run all attempts in parallel for both reference and experiment
    const runAllAttempts = async (
      key: 'reference' | 'experiment',
      client: typeof referenceStudioClient,
      studioUrl: string,
      browser: typeof referenceBrowser,
      branchLabel: string,
    ) => {
      let results: EfpsResult[] | undefined
      let lastError: unknown

      // Run attempts sequentially to get stable measurements, but both branches run in parallel
      for (let attempt = 0; attempt < TEST_ATTEMPTS; attempt++) {
        const attemptMessage = TEST_ATTEMPTS > 1 ? ` [${attempt + 1}/${TEST_ATTEMPTS}]` : ''
        const message = `Running test '${test.name}' on ${branchLabel}${attemptMessage}`

        try {
          // Note: We can't use spinner here since both branches run in parallel
          // but the individual test logs will still work
          results = mergeResults(
            results,
            await runTest({
              browser,
              key: `${key}-attempt-${attempt}`,
              test,
              resultsDir,
              client,
              headless: HEADLESS,
              recordVideo: RECORD_VIDEO,
              enableProfiler: ENABLE_PROFILER,
              studioUrl,
              log: () => {
                // Suppress logs during parallel execution to avoid interleaving
              },
            }),
          )
          spinner.succeed(`${message}`)
        } catch (error) {
          lastError = error
          spinner.fail(`${message} - failed, ${TEST_ATTEMPTS - attempt - 1} attempts remaining`)
        }
      }

      // Only fail if all attempts failed
      if (!results) {
        throw lastError
      }

      return results
    }

    spinner.info(
      `Running test '${test.name}' (${TEST_ATTEMPTS} attempts each, reference and experiment in parallel)`,
    )

    // Run reference and experiment in parallel - this is the main speedup!
    // Use Promise.allSettled to ensure both branches complete before cleanup,
    // preventing one branch's failure from closing the other's browser mid-execution
    const [refResult, expResult] = await Promise.allSettled([
      runAllAttempts(
        'reference',
        referenceStudioClient,
        REFERENCE_STUDIO_URL,
        referenceBrowser,
        '`main`',
      ),
      runAllAttempts(
        'experiment',
        experimentStudioClient,
        EXPERIMENT_STUDIO_URL,
        experimentBrowser,
        'this branch',
      ),
    ])

    // Check for errors after both have settled
    if (refResult.status === 'rejected') {
      throw refResult.reason
    }
    if (expResult.status === 'rejected') {
      throw expResult.reason
    }

    referenceResults = refResult.value
    experimentResults = expResult.value
  } finally {
    // Clean up browsers
    await Promise.all([referenceBrowser.close(), experimentBrowser.close()])
  }

  return experimentResults.map(
    (experimentResult, index): EfpsAbResult => ({
      experiment: experimentResult,
      reference: referenceResults[index],
    }),
  )
}

for (let i = 0; i < selectedTests.length; i++) {
  const test = selectedTests[i]
  testResults.push({
    name: test.name,
    results: await runAbTest(test),
  })
}

// Write the test results as a json file to the results/report directory
// the name should be in format `test-results__${shard}-${total-shards}.json`

// Create the report directory if it doesn't exist
await fs.promises.mkdir(path.join(workspaceDir, 'results', 'report'), {recursive: true})
await fs.promises.writeFile(
  path.join(
    workspaceDir,
    'results',
    'report',
    `test-results__${shard?.current}-${shard?.total}.json`,
  ),
  JSON.stringify(testResults, null, 2),
)

const comparisonTableCli = new Table({
  head: ['Benchmark', 'reference', 'experiment', 'Δ (%)', ''].map((cell) => chalk.cyan(cell)),
})

const detailedInformationCliHead = [
  'Benchmark',
  'latency',
  'p75',
  'p90',
  'p99',
  'blocking time',
  'test duration',
].map((i) => chalk.cyan(i))

const referenceTableCli = new Table({head: detailedInformationCliHead})
const experimentTableCli = new Table({head: detailedInformationCliHead})

for (const {name, results} of testResults) {
  for (const {experiment, reference} of results) {
    const significantlyDifferent = isSignificantlyDifferent(
      experiment.latency.p50,
      reference.latency.p50,
    )

    const sign = experiment.latency.p50 >= reference.latency.p50 ? '+' : ''
    const msDifference = `${sign}${(experiment.latency.p50 - reference.latency.p50).toFixed(0)}ms`
    const percentageChange = formatPercentageChange(experiment.latency.p50, reference.latency.p50)

    const benchmarkName = `${name} (${experiment.label})`

    comparisonTableCli.push([
      benchmarkName,
      `${formatEfps(reference.latency.p50)} efps (${reference.latency.p50.toFixed(0)}ms)`,
      `${formatEfps(experiment.latency.p50)} efps (${experiment.latency.p50.toFixed(0)}ms)`,
      `${significantlyDifferent ? chalk.red(msDifference) : msDifference} (${percentageChange})`,
      significantlyDifferent ? '🔴' : '✅',
    ])

    referenceTableCli.push([
      benchmarkName,
      `${reference.latency.p50.toFixed(0)}ms`,
      `${reference.latency.p75.toFixed(0)}ms`,
      `${reference.latency.p90.toFixed(0)}ms`,
      `${reference.latency.p99.toFixed(0)}ms`,
      `${reference.blockingTime.toFixed(0)}ms`,
      `${(reference.runDuration / 1000).toFixed(1)}s`,
    ])

    experimentTableCli.push([
      benchmarkName,
      `${experiment.latency.p50.toFixed(0)}ms`,
      `${experiment.latency.p75.toFixed(0)}ms`,
      `${experiment.latency.p90.toFixed(0)}ms`,
      `${experiment.latency.p99.toFixed(0)}ms`,
      `${experiment.blockingTime.toFixed(0)}ms`,
      `${(experiment.runDuration / 1000).toFixed(1)}s`,
    ])
  }
}

console.log()
console.log('Reference vs experiment')
console.log(comparisonTableCli.toString())
console.log()
console.log('Reference result')
console.log(referenceTableCli.toString())
console.log()
console.log('Experiment result')
console.log(experimentTableCli.toString())
