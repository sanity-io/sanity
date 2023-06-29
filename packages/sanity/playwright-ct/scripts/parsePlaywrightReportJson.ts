#!/usr/bin/env node -r esbuild-register

import {readFileSync, writeFileSync} from 'fs'
import type {JSONReport, JSONReportSpec, JSONReportSuite} from '@playwright/test/reporter'
import {GroupedTests, JSONReportCustom, Spec, Suite, SummaryRow} from './types'
import _ from 'lodash'
import {inspect} from 'node:util'

function readJsonFile(path: string): JSONReportCustom | null {
  try {
    const jsonData = readFileSync(path, 'utf-8')
    return JSON.parse(jsonData)
  } catch (error) {
    console.error(`Failed to read or parse file at ${path}`, error)
    throw error
  }
}

function flattenSuites(suites: Suite[]): Spec[] {
  return _.flatMap(suites, (suite) => (suite.suites ? flattenSuites(suite.suites) : suite.specs))
}
function groupTests(report: JSONReportCustom): GroupedTests {
  const flatSpecs = flattenSuites(report.suites)

  return _.chain(flatSpecs)
    .groupBy('file')
    .mapValues((suiteSpecs) =>
      _.chain(suiteSpecs)
        .groupBy('title')
        .mapValues((specs) => {
          const tests = _.flatMap(specs, 'tests')
          const summary = {
            totalDuration: _.sumBy(tests, 'results.0.duration'),
            totalSkipped: _.filter(tests, (test) => test.results[0].status === 'skipped').length,
            totalFailed: _.filter(tests, (test) => test.results[0].status === 'failed').length,
            totalPassed: _.filter(tests, (test) => test.results[0].status === 'passed').length,
            totalTests: tests.length,
          }
          return {
            summary,
            projects: _.groupBy(tests, 'projectName'),
          }
        })
        .value()
    )
    .value()
}

function calculateStatsCustom(input: JSONReportCustom) {
  return groupTests(input)
}

export interface TableRow {
  file: string
  spec: string
  totalDuration: number
  totalPassed: number
  totalSkipped: number
  totalFailed: number
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

function generateMarkdownTable(groupedTests: GroupedTests, workflowLink: string): string {
  const rows: SummaryRow[] = []

  _.forEach(groupedTests, (specs, suite) => {
    let suiteTotals = {totalDuration: 0, totalPassed: 0, totalSkipped: 0, totalFailed: 0}

    _.forEach(specs, ({summary}) => {
      suiteTotals = {
        totalDuration: suiteTotals.totalDuration + summary.totalDuration,
        totalPassed: suiteTotals.totalPassed + summary.totalPassed,
        totalSkipped: suiteTotals.totalSkipped + summary.totalSkipped,
        totalFailed: suiteTotals.totalFailed + summary.totalFailed,
      }
    })

    const statusText = suiteTotals.totalFailed > 0 ? '❌ Failed' : '✅ Passed'

    // Adding suite summary row
    rows.push({
      file: suite,
      totalDuration: suiteTotals.totalDuration,
      totalPassed: suiteTotals.totalPassed,
      totalSkipped: suiteTotals.totalSkipped,
      totalFailed: suiteTotals.totalFailed,
      status: statusText,
    })
  })

  // Generate the Markdown table
  const table = [
    '| **File** | **Duration** | **Passed** | **Skipped** | **Failed** | **Status** | **Inspect** |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map(
      ({file, totalDuration, totalPassed, totalSkipped, totalFailed, status}) =>
        `| **${file}** | ${formatDuration(
          totalDuration
        )} | ${totalPassed} | ${totalSkipped} | ${totalFailed} | ${status} | [Inspect](${workflowLink}) |`
    ),
  ].join('\n')

  return table
}

const DEBUG = Boolean(parseInt(process.env.DEBUG || '0', 2))

// Main function
function main() {
  const workflowUrl = process.env.GITHUB_WORKFLOW_URL || ''
  const jsonPath = process.env.REPORT_JSON_PATH!
  const testOutput = readJsonFile(jsonPath)

  if (testOutput) {
    const groups = calculateStatsCustom(testOutput)
    const markdownTable = generateMarkdownTable(groups, workflowUrl)
    writeFileSync('playwright-report-output.md', markdownTable, 'utf8')
    if (DEBUG) {
      const result = inspect(groups, {
        depth: Infinity,
        breakLength: 80,
        colors: true,
      })
      // eslint-disable-next-line no-console
      console.log(result)
      // eslint-disable-next-line no-console
      console.log(markdownTable)
    }
  }

  process.stdout.write('Processing complete\n')
}

main()
