/* eslint-disable no-console */
// eslint-disable-next-line import/no-unassigned-import
import 'dotenv/config'

import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

import {createClient} from '@sanity/client'
import chalk from 'chalk'
import Table from 'cli-table3'
import Ora from 'ora'

// eslint-disable-next-line import/no-extraneous-dependencies
import {exec} from './helpers/exec'
import {runTest} from './runTest'
import article from './tests/article/article'
import recipe from './tests/recipe/recipe'
import singleString from './tests/singleString/singleString'
import synthetic from './tests/synthetic/synthetic'

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

await exec({
  text: ['Ensuring playwright is installed…', 'Playwright is installed'],
  command: 'npx playwright install',
  spinner,
})

const table = new Table({
  head: [chalk.bold('benchmark'), 'eFPS p50', 'eFPS p75', 'eFPS p90'].map((cell) =>
    chalk.cyan(cell),
  ),
})

const formatFps = (fps: number) => {
  const rounded = fps.toFixed(1)
  if (fps >= 60) return chalk.green(rounded)
  if (fps < 20) return chalk.red(rounded)
  return chalk.yellow(rounded)
}

for (let i = 0; i < tests.length; i++) {
  const test = tests[i]
  const results = await runTest({
    prefix: `Running '${test.name}' [${i + 1}/${tests.length}]…`,
    test,
    resultsDir,
    spinner,
    client,
    headless,
    projectId,
  })

  for (const result of results) {
    table.push({
      [[chalk.bold(test.name), result.label ? `(${result.label})` : ''].join(' ')]: [
        formatFps(result.p50),
        formatFps(result.p75),
        formatFps(result.p90),
      ],
    })
  }
}

console.log(table.toString())
console.log(`

│ ${chalk.bold('eFPS — editor "Frames Per Second"')}
│
│ The number of renders ("frames") that is assumed to be possible
│ within a second. Derived from input latency. ${chalk.green('Higher')} is better.
`)
