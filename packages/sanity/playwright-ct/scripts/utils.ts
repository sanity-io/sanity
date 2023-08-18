import fs from 'fs'
import _ from 'lodash'
import {addMinutes, format} from 'date-fns'
import {GroupedSpec, GroupedTests, JSONReportCustom, Spec, Suite, SummaryRow} from './types'

/**
 * Typed parse of Playwright report output
 */
export function readJsonFile(filePath: string): JSONReportCustom | null {
  try {
    const jsonData = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(jsonData)
  } catch (error) {
    console.error(`Failed to read or parse file at ${filePath}`, error)
    throw error
  }
}

/**
 * Flatten the reporting suites structure
 */
export function flattenSuites(suites: Suite[]): Spec[] {
  return _.flatMap(suites, (suite) => (suite.suites ? flattenSuites(suite.suites) : suite.specs))
}

/**
 * Group tests by file and title and generate a summary
 */
export function groupTests(report: JSONReportCustom): GroupedTests {
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
        .value(),
    )
    .value()
}

/**
 * Get current date string in UTC format
 */
export function getCurrentUTCDate(): string {
  const now = new Date()

  // Get the timezone offset in minutes
  const offset = now.getTimezoneOffset()

  // Convert the date to UTC by adding the offset
  const utcNow = addMinutes(now, offset)

  // Format the UTC date
  return format(utcNow, 'PP p')
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

/**
 * Summarize all the numbers for each suite
 */
export function calculateSuiteTotals(specs: Record<string, GroupedSpec>) {
  let suiteTotals = {totalDuration: 0, totalPassed: 0, totalSkipped: 0, totalFailed: 0}

  _.forEach(specs, ({summary}) => {
    suiteTotals = {
      totalDuration: suiteTotals.totalDuration + summary.totalDuration,
      totalPassed: suiteTotals.totalPassed + summary.totalPassed,
      totalSkipped: suiteTotals.totalSkipped + summary.totalSkipped,
      totalFailed: suiteTotals.totalFailed + summary.totalFailed,
    }
  })

  return suiteTotals
}

function getStatusText(totalFailed: number) {
  return totalFailed > 0 ? '❌ Failed' : '✅ Passed'
}
export function getSuiteSummaryRow(
  suiteTotals: Omit<SummaryRow, 'status' | 'file'>,
  suite: string,
  workflowLink: string,
) {
  const statusText = getStatusText(suiteTotals.totalFailed)

  return {
    file: suite,
    totalDuration: suiteTotals.totalDuration,
    totalPassed: suiteTotals.totalPassed,
    totalSkipped: suiteTotals.totalSkipped,
    totalFailed: suiteTotals.totalFailed,
    status: `${statusText} ([Inspect](${workflowLink}))`,
  }
}

function generateMarkdownTable(rows: SummaryRow[]) {
  return [
    '| **File** | **Status** | **Duration** | **Passed** | **Skipped** | **Failed** |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map(
      ({file, totalDuration, totalPassed, totalSkipped, totalFailed, status}) =>
        `| **${file}** | ${status} | ${formatDuration(
          totalDuration,
        )} | ${totalPassed} | ${totalSkipped} | ${totalFailed} |`,
    ),
  ].join('\n')
}

/**
 * Generate PR comment output
 */
export function generateComment(rows: SummaryRow[]) {
  const updatedAtUtc = getCurrentUTCDate()
  const table = generateMarkdownTable(rows)

  return `**Component Testing Report** Updated ${updatedAtUtc} (UTC)\n\n${table}\n\n`
}

/**
 * Takes grouped test oject and the GitHub workflow link and generates a Markdown table
 * with a summary of each test, that is then posted as a comment to PRs
 *
 */
export function generateOutput(groupedTests: GroupedTests, workflowLink: string): string {
  const rows: SummaryRow[] = []

  // Loop through each test group and summarize the results
  _.forEach(groupedTests, (specs, suite) => {
    rows.push(getSuiteSummaryRow(calculateSuiteTotals(specs), suite, workflowLink))
  })

  // Generate the comment output
  return generateComment(rows)
}
