/* eslint-disable no-console */
// eslint-disable-next-line import/no-unassigned-import
import 'dotenv/config'

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

import {createClient} from '@sanity/client'
import chalk from 'chalk'
import Table from 'cli-table3'
import Ora from 'ora'
import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

import {exec} from './helpers/exec'
import {runTest} from './runTest'
import article from './tests/article/article'
import recipe from './tests/recipe/recipe'
import synthetic from './tests/synthetic/synthetic'
import {type EfpsAbResult, type EfpsResult, type EfpsTest} from './types'
import {formatPercentageChange, isSignificantlyDifferent} from './utils'

const TEST_ATTEMPTS = process.env.CI ? 3 : 1

// eslint-disable-next-line turbo/no-undeclared-env-vars
const HEADLESS = process.env.HEADLESS !== 'false'
// eslint-disable-next-line turbo/no-undeclared-env-vars
const ENABLE_PROFILER = process.env.ENABLE_PROFILER === 'true'
// eslint-disable-next-line turbo/no-undeclared-env-vars
const REFERENCE_TAG = process.env.REFERENCE_TAG || 'latest'
// eslint-disable-next-line turbo/no-undeclared-env-vars
const RECORD_VIDEO = process.env.RECORD_VIDEO === 'true'
const TESTS = [article, recipe, synthetic]

const projectId = process.env.VITE_PERF_EFPS_PROJECT_ID!
const dataset = process.env.VITE_PERF_EFPS_DATASET!
const token = process.env.PERF_EFPS_SANITY_TOKEN!

const client = createClient({
  projectId,
  dataset,
  token,
  useCdn: false,
  apiVersion: 'v2024-08-08',
})

const workspaceDir = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(workspaceDir, '../..')
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

const getSanityPkgPathForTag = async (tag: string) => {
  const tmpDir = path.join(os.tmpdir(), `sanity-${tag}`)

  try {
    await fs.promises.rm(tmpDir, {recursive: true})
  } catch {
    // intentionally blank
  }
  await fs.promises.mkdir(tmpDir, {recursive: true})

  await exec({
    command: `npm install sanity@${tag}`,
    cwd: tmpDir,
    spinner,
    text: [`Downloading sanity@${tag} package…`, `Downloaded sanity@${tag}`],
  })

  return path.join(tmpDir, 'node_modules', 'sanity')
}

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
  text: ['Building the monorepo…', 'Built monorepo'],
  command: 'pnpm run build',
  spinner,
  cwd: monorepoRoot,
})

await exec({
  text: ['Ensuring playwright is installed…', 'Playwright is installed'],
  command: 'npx playwright install',
  spinner,
})

const localSanityPkgPath = path.dirname(fileURLToPath(import.meta.resolve('sanity/package.json')))

const referenceSanityPkgPath = await getSanityPkgPathForTag(REFERENCE_TAG)
const experimentSanityPkgPath = localSanityPkgPath

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
  let referenceResults: EfpsResult[] | undefined
  let experimentResults: EfpsResult[] | undefined

  for (let attempt = 0; attempt < TEST_ATTEMPTS; attempt++) {
    const attemptMessage = TEST_ATTEMPTS > 1 ? ` [${attempt + 1}/${TEST_ATTEMPTS}]` : ''
    const referenceMessage = `Running test '${test.name}' on \`sanity@${REFERENCE_TAG}\`${attemptMessage}`
    spinner.start(referenceMessage)

    referenceResults = mergeResults(
      referenceResults,
      await runTest({
        key: 'reference',
        test,
        resultsDir,
        client,
        headless: HEADLESS,
        recordVideo: RECORD_VIDEO,
        enableProfiler: ENABLE_PROFILER,
        projectId,
        sanityPkgPath: referenceSanityPkgPath,
        log: (message) => {
          spinner.text = `${referenceMessage}: ${message}`
        },
      }),
    )
    spinner.succeed(`Ran test '${test.name}' on \`sanity@${REFERENCE_TAG}\`${attemptMessage}`)

    const experimentMessage = `Running test '${test.name}' on this branch${attemptMessage}`
    spinner.start(experimentMessage)
    experimentResults = mergeResults(
      experimentResults,
      await runTest({
        key: 'experiment',
        test,
        resultsDir,
        client,
        headless: HEADLESS,
        recordVideo: RECORD_VIDEO,
        enableProfiler: ENABLE_PROFILER,
        projectId,
        sanityPkgPath: experimentSanityPkgPath,
        log: (message) => {
          spinner.text = `${experimentMessage}: ${message}`
        },
      }),
    )
    spinner.succeed(`Ran test '${test.name}' on this branch${attemptMessage}`)
  }

  return experimentResults!.map(
    (experimentResult, index): EfpsAbResult => ({
      experiment: experimentResult,
      reference: referenceResults![index],
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
