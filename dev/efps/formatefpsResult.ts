import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {type EfpsAbResult} from './types'
import {formatPercentageChange, isSignificantlyDifferent} from './utils'

// eslint-disable-next-line turbo/no-undeclared-env-vars
const REFERENCE_TAG = process.env.REFERENCE_TAG || 'latest'

let comparisonTable = `
| Benchmark | reference<br/><sup>latency of \`sanity@${REFERENCE_TAG}\`</sup> | experiment<br/><sup>latency of this branch</sup> | Δ (%)<br/><sup>latency difference</sup> | |
| :-- | :-- | :-- | :-- | --- |
`

const detailedInformationHeader = `
| Benchmark | latency | p75 | p90 | p99 | blocking time | test duration |
| --------- | ------: | --: | --: | --: | ------------: | ------------: |
`

let referenceTable = detailedInformationHeader
let experimentTable = detailedInformationHeader

// For markdown formatting without colors
const formatEfpsPlain = (latencyMs: number) => {
  const efps = 1000 / latencyMs
  const rounded = efps.toFixed(1)

  if (efps >= 100) return '99.9+'
  return rounded
}

const workspaceDir = path.dirname(fileURLToPath(import.meta.url))

async function writeEPSResults() {
  // read all the test results from the report directory
  const reportDir = path.join(workspaceDir, 'results', 'report')

  const jsonFiles = await fs.promises.readdir(reportDir)
  const testResults: Array<{
    name: string
    results: EfpsAbResult[]
  }> = []
  for (const jsonFile of jsonFiles) {
    const json = await fs.promises.readFile(path.join(reportDir, jsonFile), 'utf-8')
    const parsedJson = JSON.parse(json) as {name: string; results: EfpsAbResult[]}
    testResults.push(parsedJson)
  }

  for (const {name, results} of testResults.flat()) {
    for (const {experiment, reference} of results) {
      const significantlyDifferent = isSignificantlyDifferent(
        experiment.latency.p50,
        reference.latency.p50,
      )

      const sign = experiment.latency.p50 >= reference.latency.p50 ? '+' : ''
      const msDifference = `${sign}${(experiment.latency.p50 - reference.latency.p50).toFixed(0)}ms`
      const percentageChange = formatPercentageChange(experiment.latency.p50, reference.latency.p50)

      const benchmarkName = `${name} (${experiment.label})`

      comparisonTable +=
        // benchmark name
        `| ${benchmarkName} ` +
        // reference latency
        `| ${formatEfpsPlain(reference.latency.p50)} efps (${reference.latency.p50.toFixed(0)}ms) ` +
        // experiment latency
        `| ${formatEfpsPlain(experiment.latency.p50)} efps (${experiment.latency.p50.toFixed(0)}ms) ` +
        // difference
        `| ${msDifference} (${percentageChange}) ` +
        // status
        `| ${significantlyDifferent ? '🔴' : '✅'} ` +
        `|\n`

      referenceTable +=
        // benchmark name
        `| ${benchmarkName} ` +
        // latency
        `| ${reference.latency.p50.toFixed(0)}ms ` +
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
        `| ${experiment.latency.p50.toFixed(0)}ms ` +
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
> - **latency** — the time between when a key was pressed and when it was rendered. derived from a set of samples. the median (p50) is shown to show the most common latency.
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
}

writeEPSResults()
