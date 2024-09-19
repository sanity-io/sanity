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
import singleString from './tests/singleString/singleString'
import synthetic from './tests/synthetic/synthetic'
import {type EfpsResult} from './types'

const headless = true
const tests = [singleString, recipe, article, synthetic]

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

const spinner = Ora()

spinner.info(`Running ${tests.length} tests: ${tests.map((t) => `'${t.name}'`).join(', ')}`)

await exec({
  text: ['Building the monorepo…', 'Built monorepo'],
  command: 'pnpm run build',
  spinner,
  cwd: monorepoRoot,
})

// Prepare the latest version of the 'sanity' package
const tmpDir = path.join(os.tmpdir(), `sanity-latest-${Date.now()}`)
await fs.promises.mkdir(tmpDir, {recursive: true})
spinner.start('')
await exec({
  command: 'npm install sanity@latest --no-save',
  cwd: tmpDir,
  spinner,
  text: ['Downloading latest sanity package…', 'Downloaded latest sanity package'],
})
const sanityPackagePath = path.join(tmpDir, 'node_modules', 'sanity')

await exec({
  text: ['Ensuring playwright is installed…', 'Playwright is installed'],
  command: 'npx playwright install',
  spinner,
})

const table = new Table({
  head: [
    chalk.bold('benchmark'),
    'latest p50',
    'local p50 (Δ%)',
    'latest p75',
    'local p75 (Δ%)',
    'latest p90',
    'local p90 (Δ%)',
  ].map((cell) => chalk.cyan(cell)),
})

const formatFps = (fps: number) => {
  const rounded = fps.toFixed(1)
  if (fps >= 60) return chalk.green(rounded)
  if (fps < 20) return chalk.red(rounded)
  return chalk.yellow(rounded)
}

const formatPercentage = (value: number): string => {
  const rounded = value.toFixed(1)
  const sign = value >= 0 ? '+' : ''
  if (value >= 0) return chalk.green(`${sign}${rounded}%`)
  return chalk.red(`${rounded}%`)
}

// Initialize the regression flag
let hasSignificantRegression = false

interface TestResult {
  testName: string
  version: 'local' | 'latest'
  results: EfpsResult[]
}

const allResults: TestResult[] = []

for (let i = 0; i < tests.length; i++) {
  const test = tests[i]

  // Run with local 'sanity' package
  const localResults = await runTest({
    prefix: `Running '${test.name}' [${i + 1}/${tests.length}] with local 'sanity'…`,
    test,
    resultsDir,
    spinner,
    client,
    headless,
    projectId,
  })

  allResults.push({
    testName: test.name,
    version: 'local',
    results: localResults,
  })

  // Run with latest 'sanity' package
  const latestResults = await runTest({
    prefix: `Running '${test.name}' [${i + 1}/${tests.length}] with 'sanity@latest'…`,
    test,
    resultsDir,
    spinner,
    client,
    headless,
    projectId,
    sanityPackagePath,
  })

  allResults.push({
    testName: test.name,
    version: 'latest',
    results: latestResults,
  })
}

for (const test of tests) {
  const localResult = allResults.find((r) => r.testName === test.name && r.version === 'local')
  const latestResult = allResults.find((r) => r.testName === test.name && r.version === 'latest')

  if (localResult && latestResult) {
    const localResultsMap = new Map<string | undefined, EfpsResult>()
    for (const res of localResult.results) {
      localResultsMap.set(res.label, res)
    }
    const latestResultsMap = new Map<string | undefined, EfpsResult>()
    for (const res of latestResult.results) {
      latestResultsMap.set(res.label, res)
    }

    for (const [label, latest] of latestResultsMap) {
      const local = localResultsMap.get(label)
      if (local) {
        // Compute percentage differences
        const p50Diff = ((local.p50 - latest.p50) / latest.p50) * 100
        const p75Diff = ((local.p75 - latest.p75) / latest.p75) * 100
        const p90Diff = ((local.p90 - latest.p90) / latest.p90) * 100

        // Check for significant regression
        // eslint-disable-next-line max-depth
        if (p50Diff < -50 || p75Diff < -50 || p90Diff < -50) {
          hasSignificantRegression = true
        }

        const rowLabel = [chalk.bold(test.name), label ? `(${label})` : ''].join(' ')

        table.push([
          rowLabel,
          formatFps(latest.p50),
          `${formatFps(local.p50)} (${formatPercentage(p50Diff)})`,
          formatFps(latest.p75),
          `${formatFps(local.p75)} (${formatPercentage(p75Diff)})`,
          formatFps(latest.p90),
          `${formatFps(local.p90)} (${formatPercentage(p90Diff)})`,
        ])
      } else {
        spinner.fail(`Missing local result for test '${test.name}', label '${label}'`)
      }
    }
  } else {
    spinner.fail(`Missing results for test '${test.name}'`)
  }
}

console.log(table.toString())
console.log(`

│ ${chalk.bold('eFPS — editor "Frames Per Second"')}
│
│ The number of renders ("frames") that is assumed to be possible
│ within a second. Derived from input latency. ${chalk.green('Higher')} is better.
`)

// Exit with code 1 if regression detected
if (hasSignificantRegression) {
  console.error(chalk.red('Performance regression detected exceeding 50% threshold.'))
  process.exit(1)
}
