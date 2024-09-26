/* eslint-disable max-depth */
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
import {type EfpsResult} from './types'

const tag = 'latest'
const deltaThreshold = 0.2

const headless = true
const tests = [recipe, article, synthetic]

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

const tmpDir = path.join(os.tmpdir(), `sanity-${tag}-${Date.now()}`)
await fs.promises.mkdir(tmpDir, {recursive: true})
spinner.start('')
await exec({
  command: `pnpm install sanity@${tag}`,
  cwd: tmpDir,
  spinner,
  text: [`Downloading sanity@${tag} package…`, `Downloaded sanity@${tag}`],
})
const baseSanityPkgPath = path.join(tmpDir, 'node_modules', 'sanity')
const localSanityPkgPath = path.dirname(fileURLToPath(import.meta.resolve('sanity/package.json')))

// const compareTag = 'v3.57.0'

// await exec({
//   command: `pnpm install sanity@${compareTag}`,
//   cwd: tmpDir,
//   spinner,
//   text: [`Downloading sanity@${compareTag} package…`, `Downloaded sanity@${compareTag}`],
// })
// const compareSanityPkgPath = path.join(tmpDir, 'node_modules', 'sanity')

await exec({
  text: ['Ensuring playwright is installed…', 'Playwright is installed'],
  command: 'npx playwright install',
  spinner,
})

const formatFps = (fps: number) => {
  const rounded = fps.toFixed(1)
  if (fps >= 100) return chalk.green('99.9+')
  if (fps >= 60) return chalk.green(rounded)
  if (fps >= 20) return chalk.yellow(rounded)
  return chalk.red(rounded)
}

const formatPercentage = (delta: number): string => {
  const percentage = delta * 100
  const rounded = percentage.toFixed(1)
  const sign = delta >= 0 ? '+' : ''
  if (delta >= -deltaThreshold) return `${sign}${rounded}%`
  return chalk.red(`${sign}${rounded}%`)
}

// For markdown formatting without colors
const formatFpsPlain = (fps: number) => {
  if (fps >= 100) return '99.9+'
  const rounded = fps.toFixed(1)
  return rounded
}

const formatPercentagePlain = (delta: number): string => {
  const percentage = delta * 100
  const rounded = percentage.toFixed(1)
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${rounded}%`
}

const testOutput: Array<{
  name: string
  results: Array<EfpsResult & {delta: number; passed: boolean}>
}> = []
for (let i = 0; i < tests.length; i++) {
  const test = tests[i]

  const localResult1 = await runTest({
    prefix: `Running test '${test.name}' [${i + 1}/${tests.length}] with local… 1`,
    test,
    resultsDir,
    client,
    headless,
    projectId,
    sanityPkgPath: localSanityPkgPath,
    log: () => {},
  })
  const baseResult1 = await runTest({
    prefix: `Running '${test.name}' [${i + 1}/${tests.length}] with 'sanity@${tag}'… 1`,
    test,
    resultsDir,
    client,
    headless,
    projectId,
    sanityPkgPath: localSanityPkgPath,
    log: () => {},
  })
  const localResult2 = await runTest({
    prefix: `Running test '${test.name}' [${i + 1}/${tests.length}] with local… 2`,
    test,
    resultsDir,
    client,
    headless,
    projectId,
    sanityPkgPath: localSanityPkgPath,
    log: () => {},
  })
  const baseResult2 = await runTest({
    prefix: `Running '${test.name}' [${i + 1}/${tests.length}] with 'sanity@${tag}'… 2`,
    test,
    resultsDir,
    client,
    headless,
    projectId,
    sanityPkgPath: localSanityPkgPath,
    log: () => {},
  })
  const localResult3 = await runTest({
    prefix: `Running test '${test.name}' [${i + 1}/${tests.length}] with local… 3`,
    test,
    resultsDir,
    client,
    headless,
    projectId,
    sanityPkgPath: localSanityPkgPath,
    log: () => {},
  })
  const baseResult3 = await runTest({
    prefix: `Running '${test.name}' [${i + 1}/${tests.length}] with 'sanity@${tag}'… 3`,
    test,
    resultsDir,
    client,
    headless,
    projectId,
    sanityPkgPath: localSanityPkgPath,
    log: () => {},
  })

  const localResults = localResult1.map((result1, index) => {
    const result2 = localResult2[index]
    const result3 = localResult3[index]

    let min = result1
    const arr = [result1, result2, result3]

    for (const item of arr) {
      if (item.p50 < min.p50) {
        min = item
      }
    }

    return min
  })

  const baseResults = baseResult1.map((result1, index) => {
    const result2 = baseResult2[index]
    const result3 = baseResult3[index]

    let min = result1
    const arr = [result1, result2, result3]

    for (const item of arr) {
      if (item.p50 < min.p50) {
        min = item
      }
    }

    return min
  })

  const combinedResults = localResults.map((localResult, index) => {
    const baseResult = baseResults[index]
    const delta = (localResult.p50 - baseResult.p50) / baseResult.p50
    return {
      ...localResult,
      delta,
      passed: delta >= -deltaThreshold,
    }
  })

  testOutput.push({name: test.name, results: combinedResults})
}

const p50Min = testOutput.flatMap((i) => i.results).sort((a, b) => a.p50 - b.p50)[0]

const table = new Table({
  head: [chalk.bold('Benchmark'), 'eFPS', `vs \`${tag}\``, 'Passed?'].map((cell) =>
    chalk.cyan(cell),
  ),
})

for (const {name, results} of testOutput) {
  for (const {delta, p50, label, passed} of results) {
    table.push([
      label ? `${name} (${label})` : name,
      formatFps(p50),
      formatPercentage(delta),
      passed ? '✅' : '🔴',
    ])
  }
}

const allPassed = testOutput.flatMap((i) => i.results).every((i) => i.passed)

console.log(table.toString())
console.log(`
${chalk.bold('Lowest eFPS:')} ${formatFps(p50Min.p50)}`)
console.log(`

│ ${chalk.bold('eFPS — Editor "Frames Per Second"')}
│ The number of renders, aka "frames", that are assumed to be possible
│ within a second. Derived from input latency. ${chalk.green('Higher')} is better.
│
│ ${chalk.bold(`vs \`${tag}\``)}
│ The percentage difference of the current branch when compared to \`sanity@${tag}\`.
│
│ ${chalk.bold('Passed?')}
│ Tests are failed when any of the median eFPS results perform more than ${deltaThreshold * 100}% worse.
`)

const markdown = `
<details>
<summary><strong>⚡️ Editor Performance Report</strong><br/><br/>

| <strong>${formatFpsPlain(p50Min.p50)}</strong> <br/><sub>eFPS</sub> | ${formatPercentagePlain(p50Min.delta)}<br/><sub>vs <code>${tag}</code></sub> | ${allPassed ? '✅' : '🔴'} <br/> <sub>${allPassed ? 'Passed' : 'Failed'}</sub> |
| --- | --- | --- |

> **eFPS** — Editor "Frames Per Second"
> <sup>The number of renders aka "frames" that is assumed to be possible within a second. Derived from input latency. _Higher_ is better.</sup>

<sup>↓ expand for details</sup>
</summary>

| Benchmark | eFPS | vs \`${tag}\` | Passed? |
|-----------| ---: | ------------: | :-----: |
${testOutput
  .flatMap((test) =>
    test.results.map((result) => ({
      ...result,
      label: result.label ? `${test.name} (${result.label})` : test.name,
    })),
  )
  .map(
    ({label, p50, delta, passed}) =>
      `| ${label} | ${formatFpsPlain(p50)} | ${formatPercentagePlain(delta)} | ${passed ? '✅' : '🔴'} |`,
  )
  .join('\n')}

> **eFPS — Editor "Frames Per Second"**
> The number of renders, aka "frames", that are assumed to be possible within a second.
> Derived from input latency. _Higher_ is better.
>
> **vs \`${tag}\`**
> The percentage difference of the current branch when compared to \`sanity@${tag}\`.
>
> **Passed?**
> Tests are failed when any of the median eFPS results perform more than ${deltaThreshold * 100}% worse.
`

// Write markdown file to root of results
const markdownOutputPath = path.join(workspaceDir, 'results', 'benchmark-results.md')
await fs.promises.writeFile(markdownOutputPath, markdown)

// Exit with code 1 if regression detected
if (!allPassed) {
  process.exit(1)
}
