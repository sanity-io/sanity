import {readFileSync} from 'node:fs'
import path from 'node:path'

import {parseGeneratorReport, parseVerdictsFile} from './contracts'
import {type FailureOutcome, type ReportPair} from './fileFailures'

export interface ReadPairs {
  pairs: ReportPair[]
  errors: FailureOutcome[]
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function readPair(reportPath: string, verdictsPath: string): ReportPair | FailureOutcome {
  const label = path.basename(verdictsPath)
  try {
    const report = parseGeneratorReport(readFileSync(path.resolve(reportPath), 'utf8'))
    try {
      return {
        report,
        verdicts: parseVerdictsFile(readFileSync(path.resolve(verdictsPath), 'utf8')),
      }
    } catch (error) {
      return {
        source: 'failure',
        signature: label,
        seam: report.seam,
        action: 'error',
        reason: `could not read the verdicts file: ${messageOf(error)}`,
      }
    }
  } catch (error) {
    return {
      source: 'failure',
      signature: path.basename(reportPath),
      action: 'error',
      reason: `could not read the report: ${messageOf(error)}`,
    }
  }
}

function isPair(entry: ReportPair | FailureOutcome): entry is ReportPair {
  return 'report' in entry
}

function isError(entry: ReportPair | FailureOutcome): entry is FailureOutcome {
  return 'action' in entry
}

/** Reads each report and verdicts pair on its own so one unreadable file cannot stop the others. */
export function readPairs(paths: string[]): ReadPairs {
  const entries = paths
    .filter((_, index) => index % 2 === 0)
    .map((reportPath, pairIndex) => readPair(reportPath, paths[pairIndex * 2 + 1]))
  return {
    pairs: entries.filter(isPair),
    errors: entries.filter(isError),
  }
}
