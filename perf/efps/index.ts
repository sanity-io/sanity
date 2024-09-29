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

import {exec} from './helpers/exec'
import {runTest} from './runTest'
import article from './tests/article/article'
import recipe from './tests/recipe/recipe'
import synthetic from './tests/synthetic/synthetic'
import {type EfpsAbResult, type EfpsResult, type EfpsTest} from './types'

const WARNING_THRESHOLD = 0.2
const TEST_ATTEMPTS = process.env.CI ? 3 : 1

const HEADLESS = true
const REFERENCE_TAG = 'latest'
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

const formatPercentageChange = (experiment: number, reference: number): string => {
  if (experiment < 16 && reference < 16) return '-/-%'
  const delta = (experiment - reference) / reference
  if (!delta) return '-/-%'
  const percentage = delta * 100
  const rounded = percentage.toFixed(1)
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${rounded}%`
}

// For markdown formatting without colors
const formatEfpsPlain = (latencyMs: number) => {
  const efps = 1000 / latencyMs
  const rounded = efps.toFixed(1)

  if (efps >= 100) return '99.9+'
  return rounded
}

const spinner = Ora()

spinner.info(`Running ${TESTS.length} tests: ${TESTS.map((t) => `'${t.name}'`).join(', ')}`)

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

    const incomingMedianLatency = incomingResult.latency.median
    const baseMedianLatency = baseResult.latency.median

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
    referenceResults = mergeResults(
      referenceResults,
      await runTest({
        prefix: `running ${referenceSanityPkgPath}`,
        key: 'reference',
        test,
        resultsDir,
        client,
        headless: HEADLESS,
        projectId,
        sanityPkgPath: referenceSanityPkgPath,
        log: () => {},
      }),
    )

    experimentResults = mergeResults(
      experimentResults,
      await runTest({
        prefix: `running ${experimentSanityPkgPath}`,
        key: 'experiment',
        test,
        resultsDir,
        client,
        headless: HEADLESS,
        projectId,
        sanityPkgPath: experimentSanityPkgPath,
        log: () => {},
      }),
    )
  }

  return experimentResults!.map(
    (experimentResult, index): EfpsAbResult => ({
      experiment: experimentResult,
      reference: referenceResults![index],
    }),
  )
}

for (let i = 0; i < TESTS.length; i++) {
  const test = TESTS[i]
  testResults.push({
    name: test.name,
    results: await runAbTest(test),
  })
}

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

function isSignificantlyDifferent(experiment: number, reference: number) {
  // values are too small to and are already performing well
  if (experiment < 16 && reference < 16) return false
  const delta = (experiment - reference) / reference
  return delta >= WARNING_THRESHOLD
}

for (const {name, results} of testResults) {
  for (const {experiment, reference} of results) {
    const significantlyDifferent = isSignificantlyDifferent(
      experiment.latency.median,
      reference.latency.median,
    )

    const sign = experiment.latency.median >= reference.latency.median ? '+' : ''
    const msDifference = `${sign}${(experiment.latency.median - reference.latency.median).toFixed(0)}ms`
    const percentageChange = formatPercentageChange(
      experiment.latency.median,
      reference.latency.median,
    )

    const benchmarkName = `${name} (${experiment.label})`

    comparisonTableCli.push([
      benchmarkName,
      `${formatEfps(reference.latency.median)} efps (${reference.latency.median.toFixed(0)}ms)`,
      `${formatEfps(experiment.latency.median)} efps (${experiment.latency.median.toFixed(0)}ms)`,
      `${significantlyDifferent ? chalk.red(msDifference) : msDifference} (${percentageChange})`,
      significantlyDifferent ? '🔴' : '✅',
    ])

    referenceTableCli.push([
      benchmarkName,
      `${reference.latency.median.toFixed(0)}±${reference.latency.spread.toFixed(0)}ms`,
      `${reference.latency.p75.toFixed(0)}ms`,
      `${reference.latency.p90.toFixed(0)}ms`,
      `${reference.latency.p99.toFixed(0)}ms`,
      `${reference.blockingTime.toFixed(0)}ms`,
      `${(reference.runDuration / 1000).toFixed(1)}s`,
    ])

    experimentTableCli.push([
      benchmarkName,
      `${experiment.latency.median.toFixed(0)}±${experiment.latency.spread.toFixed(0)}ms`,
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

let comparisonTable = `
| Benchmark | reference<br/><sup>input latency</sup> | experiment<br/><sup>input latency</sup> | Δ (%)<br/><sup>latency difference</sup> | |
| :-- | :-- | :-- | :-- | --- |
`

const detailedInformationHeader = `
| Benchmark | latency | p75 | p90 | p99 | blocking time | test duration |
| --------- | ------: | --: | --: | --: | ------------: | ------------: |
`

let referenceTable = detailedInformationHeader
let experimentTable = detailedInformationHeader

for (const {name, results} of testResults) {
  for (const {experiment, reference} of results) {
    const significantlyDifferent = isSignificantlyDifferent(
      experiment.latency.median,
      reference.latency.median,
    )

    const sign = experiment.latency.median >= reference.latency.median ? '+' : ''
    const msDifference = `${sign}${(experiment.latency.median - reference.latency.median).toFixed(0)}ms`
    const percentageChange = formatPercentageChange(
      experiment.latency.median,
      reference.latency.median,
    )

    const benchmarkName = `${name} (${experiment.label})`

    comparisonTable +=
      // benchmark name
      `| ${benchmarkName} ` +
      // reference latency
      `| ${formatEfpsPlain(reference.latency.median)} efps (${reference.latency.median.toFixed(0)}ms) ` +
      // experiment latency
      `| ${formatEfpsPlain(experiment.latency.median)} efps (${experiment.latency.median.toFixed(0)}ms) ` +
      // difference
      `| ${msDifference} (${percentageChange}) ` +
      // status
      `| ${significantlyDifferent ? '🔴' : '✅'} ` +
      `|\n`

    referenceTable +=
      // benchmark name
      `| ${benchmarkName} ` +
      // latency
      `| ${reference.latency.median.toFixed(0)}±${reference.latency.spread.toFixed(0)}ms ` +
      // p75
      `| ${reference.latency.p75.toFixed(0)}ms ` +
      // p90
      `| ${reference.latency.p90.toFixed(0)}ms ` +
      // p99
      `| ${reference.latency.p99.toFixed(0)}ms ` +
      // blocking time
      `| ${reference.blockingTime.toFixed(0)}ms ` +
      // test duration
      `| ${(reference.runDuration / 1000).toFixed(1)}s ` +
      `|\n`

    experimentTable +=
      // benchmark name
      `| ${benchmarkName} ` +
      // latency
      `| ${experiment.latency.median.toFixed(0)}±${experiment.latency.spread.toFixed(0)}ms ` +
      // p75
      `| ${experiment.latency.p75.toFixed(0)}ms ` +
      // p90
      `| ${experiment.latency.p90.toFixed(0)}ms ` +
      // p99
      `| ${experiment.latency.p99.toFixed(0)}ms ` +
      // blocking time
      `| ${experiment.blockingTime.toFixed(0)}ms ` +
      // test duration
      `| ${(experiment.runDuration / 1000).toFixed(1)}s ` +
      `|\n`
  }
}

const markdown = `### ⚡️ Editor Performance Report

Updated ${new Date().toUTCString()}

${comparisonTable}

> **efps** — editor "frames per second". The number of updates assumed to be possible within a second.
>
> Derived from input latency. \`efps = 1000 / input_latency\`

<details>

<summary><strong>Detailed information</strong></summary>

### 🏠 Reference result

The performance result of \`sanity@${REFERENCE_TAG}\`


${referenceTable}

### 🧪 Experiment result

The performance result of this branch

${experimentTable}

### 📚 Glossary

> #### column definitions
>
> - **benchmark** — the name of the test, e.g. "article", followed by the label of the field being measured, e.g. "(title)".
> - **latency** — the time between when a key was pressed and when it was rendered. derived from a set of samples. the median (p50) is shown along with its spread.
> - **p75** — the 75th percentile of the input latency in the test run. 75% of the sampled inputs in this benchmark were processed faster than this value. this provides insight into the upper range of typical performance.
> - **p90** — the 90th percentile of the input latency in the test run. 90% of the sampled inputs were faster than this. this metric helps identify slower interactions that occurred less frequently during the benchmark.
> - **p99** — the 99th percentile of the input latency in the test run. only 1% of sampled inputs were slower than this. this represents the worst-case scenarios encountered during the benchmark, useful for identifying potential performance outliers.
> - **blocking time** — the total time during which the main thread was blocked, preventing user input and UI updates. this metric helps identify performance bottlenecks that may cause the interface to feel unresponsive.
> - **test duration** — how long the test run took to complete.

</details>
`

// Write markdown file to root of results
const markdownOutputPath = path.join(workspaceDir, 'results', 'benchmark-results.md')
await fs.promises.writeFile(markdownOutputPath, markdown)
