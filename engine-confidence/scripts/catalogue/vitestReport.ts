import path from 'node:path'

import {without} from '../collections'

export interface VitestJsonReport {
  testResults: Array<{
    name: string
    status: string
    assertionResults: Array<{
      status: string
      title: string
      ancestorTitles: string[]
      fullName: string
    }>
  }>
}

export interface FailingTest {
  /** Repo-relative. */
  file: string
  /** Suite and test titles joined with ` > `, the form Vitest's name pattern matches. */
  name: string
  id: string
}

const FILE_FAILED_TO_RUN = '(file failed to run)'

export function failingTestsOf(report: VitestJsonReport, repositoryRoot: string): FailingTest[] {
  return report.testResults.flatMap((fileResult) => {
    const file = path.relative(repositoryRoot, fileResult.name)
    const failedAssertions = fileResult.assertionResults
      .filter((assertion) => assertion.status === 'failed')
      .map((assertion) => {
        const name = [...assertion.ancestorTitles, assertion.title].join(' > ')
        return {file, name, id: `${file} > ${name}`}
      })
    const fileFailedToRun = fileResult.status === 'failed' && failedAssertions.length === 0
    return fileFailedToRun
      ? [{file, name: FILE_FAILED_TO_RUN, id: `${file} > ${FILE_FAILED_TO_RUN}`}]
      : failedAssertions
  })
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** A `-t` pattern matching exactly the given tests; file-level failures match their whole file. */
export function namePatternFor(tests: FailingTest[]): string | undefined {
  const named = tests.filter((test) => test.name !== FILE_FAILED_TO_RUN)
  return named.length === tests.length && named.length > 0
    ? `(?:${named.map((test) => escapeRegExp(test.name)).join('|')})$`
    : undefined
}

export function newFailuresOf(current: FailingTest[], baseline: FailingTest[]): FailingTest[] {
  return without(current, baseline, (test) => test.id)
}

export function uniqueFilesOf(tests: FailingTest[]): string[] {
  return [...new Set(tests.map((test) => test.file))]
}
