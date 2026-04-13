// oxlint-disable no-console
// oxlint-disable-next-line no-unassigned-import
import 'dotenv/config'

import {execSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {createClient} from '@sanity/client'
import chalk from 'chalk'
import Table from 'cli-table3'
import {chromium} from 'playwright'

import {collectMetrics} from './collect'
import {compareResults, hasSignificantRegression} from './compare'
import {METRICS_DATASET, METRICS_PROJECT_ID, STUDIO_PROJECT_ID} from './config'
import {formatMarkdownReport} from './formatReport'
import {studioBoot} from './scenarios/index'
import {
  type ComparisonResult,
  type ResourceMetrics,
  type Scenario,
  type ScenarioResult,
} from './types'

const workspaceDir = path.dirname(fileURLToPath(import.meta.url))

// eslint-disable-next-line turbo/no-undeclared-env-vars
const HEADLESS = process.env.HEADLESS !== 'false'
const STUDIO_URL = process.env.STUDIO_URL || 'http://localhost:3333'
const STUDIO_TOKEN = process.env.RESOURCE_METRICS_STUDIO_TOKEN || ''
const METRICS_TOKEN = process.env.RESOURCE_METRICS_WRITE_TOKEN || ''

// eslint-disable-next-line turbo/no-undeclared-env-vars
const REFERENCE_RESULTS_PATH = process.env.REFERENCE_RESULTS_PATH || ''

function getCommitSha(): string {
  try {
    return execSync('git rev-parse HEAD', {encoding: 'utf-8'}).trim()
  } catch {
    return 'unknown'
  }
}

function getBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {encoding: 'utf-8'}).trim()
  } catch {
    return 'unknown'
  }
}

function validateReferencePath(refPath: string): void {
  const resolved = path.resolve(refPath)
  const repoRoot = path.resolve(workspaceDir, '..', '..')
  if (!resolved.startsWith(repoRoot)) {
    throw new Error(
      `REFERENCE_RESULTS_PATH must point to a file within the repository. Got: ${refPath}`,
    )
  }
}

async function runScenario(
  studioUrl: string,
  token: string,
  scenario: Scenario,
  ...urlArgs: string[]
): Promise<ScenarioResult> {
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--disable-gpu', '--disable-software-rasterizer'],
  })

  try {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      storageState: {
        cookies: [],
        origins: [
          {
            origin: studioUrl,
            localStorage: [
              {
                name: `__studio_auth_token_${STUDIO_PROJECT_ID}`,
                value: JSON.stringify({
                  token,
                  time: new Date().toISOString(),
                }),
              },
            ],
          },
        ],
      },
    })

    const page = await context.newPage()
    const url = scenario.getUrl(studioUrl, ...urlArgs)

    const result = await collectMetrics({
      page,
      url,
      waitForReady: scenario.waitForReady,
    })

    await context.close()

    return {
      scenario: scenario.name,
      metrics: result.metrics,
      requests: result.requests,
      timestamp: new Date().toISOString(),
      commitSha: getCommitSha(),
    }
  } finally {
    await browser.close()
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function printResult(label: string, result: ScenarioResult) {
  const table = new Table({
    head: ['Metric', 'Value'].map((h) => chalk.cyan(h)),
  })

  table.push(
    ['HTTP Requests', String(result.metrics.httpRequestCount)],
    ['Transfer Size', formatBytes(result.metrics.httpTransferBytes)],
    ['DOM Nodes', String(result.metrics.domNodeCount)],
    ['Event Listeners', String(result.metrics.jsEventListenerCount)],
    ['JS Heap (after GC)', formatBytes(result.metrics.jsHeapUsedBytes)],
  )

  console.log(`\n${chalk.bold(label)} — ${result.scenario}`)
  console.log(table.toString())
}

function printComparison(comparison: ComparisonResult) {
  const table = new Table({
    head: ['Metric', 'Reference', 'Experiment', 'Δ', ''].map((h) => chalk.cyan(h)),
  })

  const metricConfigs: Array<{
    key: keyof ResourceMetrics
    label: string
    format: (v: number) => string
  }> = [
    {key: 'httpRequestCount', label: 'HTTP Requests', format: String},
    {key: 'httpTransferBytes', label: 'Transfer Size', format: formatBytes},
    {key: 'domNodeCount', label: 'DOM Nodes', format: String},
    {key: 'jsEventListenerCount', label: 'Event Listeners', format: String},
    {key: 'jsHeapUsedBytes', label: 'JS Heap (after GC)', format: formatBytes},
  ]

  for (const {key, label, format} of metricConfigs) {
    const ref = comparison.reference[key]
    const exp = comparison.experiment[key]
    const {absolute, percent} = comparison.delta[key]

    let deltaStr = '-'
    if (absolute !== 0) {
      const sign = absolute > 0 ? '+' : '-'
      const pctStr = isFinite(percent) ? ` (${sign}${Math.abs(percent * 100).toFixed(1)}%)` : ''
      deltaStr = `${sign}${format(Math.abs(absolute))}${pctStr}`
    }

    const icon = absolute <= 0 ? '✅' : '🔴'
    table.push([label, format(ref), format(exp), deltaStr, icon])
  }

  console.log(`\n${chalk.bold('Comparison')} — ${comparison.scenario}`)
  console.log(table.toString())

  if (hasSignificantRegression(comparison)) {
    console.log(chalk.yellow('⚠️  Regression detected in this scenario'))
  }
}

async function main() {
  console.log(chalk.bold('📊 Resource Metrics'))
  console.log(`Studio URL: ${STUDIO_URL}`)
  console.log(`Commit: ${getCommitSha()}`)
  console.log()

  // Run the studio-boot scenario
  console.log('Running studio-boot scenario…')
  const bootResult = await runScenario(STUDIO_URL, STUDIO_TOKEN, studioBoot)
  printResult('Experiment', bootResult)

  const experimentResults = [bootResult]

  // TODO: Add document-open scenario when we have a way to create/reference a test document

  // Save experiment results
  const resultsDir = path.join(workspaceDir, 'results')
  await fs.promises.mkdir(resultsDir, {recursive: true})
  await fs.promises.writeFile(
    path.join(resultsDir, 'experiment.json'),
    JSON.stringify(experimentResults, null, 2),
  )

  // Compare against reference if available
  if (REFERENCE_RESULTS_PATH) {
    validateReferencePath(REFERENCE_RESULTS_PATH)
    const referenceRaw = await fs.promises.readFile(REFERENCE_RESULTS_PATH, 'utf-8')
    const referenceResults: ScenarioResult[] = JSON.parse(referenceRaw)

    const comparisons: ComparisonResult[] = []
    for (const expResult of experimentResults) {
      const refResult = referenceResults.find((r) => r.scenario === expResult.scenario)
      if (refResult) {
        const comparison = compareResults(refResult, expResult)
        comparisons.push(comparison)
        printComparison(comparison)
      }
    }

    // Write comparison report
    const reportDir = path.join(resultsDir, 'report')
    await fs.promises.mkdir(reportDir, {recursive: true})
    await fs.promises.writeFile(
      path.join(reportDir, 'comparison.json'),
      JSON.stringify(comparisons, null, 2),
    )

    const markdown = formatMarkdownReport(comparisons)
    await fs.promises.writeFile(path.join(resultsDir, 'resource-metrics-report.md'), markdown)
    console.log(`\nReport written to ${path.join(resultsDir, 'resource-metrics-report.md')}`)
  }

  // Write to Sanity dataset for time-series tracking (only on main)
  if (METRICS_TOKEN && getBranch() === 'main') {
    console.log('\nWriting metrics to Sanity dataset…')
    const metricsClient = createClient({
      projectId: METRICS_PROJECT_ID,
      dataset: METRICS_DATASET,
      token: METRICS_TOKEN,
      apiVersion: '2024-08-08',
      useCdn: false,
    })

    await metricsClient.create({
      _type: 'resourceMetrics',
      commitSha: getCommitSha(),
      branch: getBranch(),
      timestamp: new Date().toISOString(),
      scenarios: experimentResults.map((r) => ({
        _key: r.scenario,
        name: r.scenario,
        metrics: r.metrics,
        requests: r.requests,
      })),
    })
    console.log('Metrics saved to Sanity dataset.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
