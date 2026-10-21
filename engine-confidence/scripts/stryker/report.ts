import {readFileSync} from 'node:fs'
import {stripVTControlCharacters} from 'node:util'

import {type StrykerMutantStatus, type StrykerTargetId} from '@repo/utils/engine-confidence'

export interface StrykerMutant {
  id: string
  mutatorName: string
  replacement?: string
  status: StrykerMutantStatus
  static?: boolean
  testsCompleted?: number
  coveredBy?: string[]
  location?: {start: {line: number; column: number}; end: {line: number; column: number}}
}

export interface StrykerFileReport {
  source?: string
  mutants: StrykerMutant[]
}

export interface StrykerReport {
  projectRoot?: string
  files: Record<string, StrykerFileReport>
  testFiles?: Record<string, {tests: Array<{id: string; name: string}>}>
}

export interface StrykerRunMeta {
  target: StrykerTargetId
  mode: 'full' | 'incremental'
  reusedMutants: number
  dryRunTests: number
  durationMs: number
  configVersion: number
  configHash: string
}

export function readStrykerReport(reportPath: string): StrykerReport {
  return JSON.parse(readFileSync(reportPath, 'utf8')) as StrykerReport
}

export function dryRunTestCount(report: StrykerReport): number {
  return Object.values(report.testFiles ?? {}).reduce(
    (total, testFile) => total + testFile.tests.length,
    0,
  )
}

export interface ZeroTestSurvivor {
  file: string
  mutantId: string
  mutatorName: string
  line?: number
}

/**
 * A surviving mutant that tests cover but that ran none of them is the signature of the
 * vitest-runner test-name bug, so a lost patch fails the first run.
 */
export function zeroTestSurvivorsOf(report: StrykerReport): ZeroTestSurvivor[] {
  return Object.entries(report.files).flatMap(([file, fileReport]) =>
    fileReport.mutants
      .filter(
        (mutant) =>
          mutant.status === 'Survived' &&
          (mutant.coveredBy ?? []).length > 0 &&
          mutant.testsCompleted === 0,
      )
      .map((mutant) => ({
        file,
        mutantId: mutant.id,
        mutatorName: mutant.mutatorName,
        line: mutant.location?.start.line,
      })),
  )
}

export function reusedMutantsFromLog(logText: string): number {
  const withoutAnsi = stripVTControlCharacters(logText)
  const match = /(\d+) of \d+ mutant result\(s\) are reused/.exec(withoutAnsi)
  return match === null ? 0 : Number(match[1])
}
