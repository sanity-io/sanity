import path from 'node:path'

import {
  countMutantStatuses,
  type MutatedFileResult,
  type StrykerTargetId,
} from '@repo/utils/engine-confidence'

import {type StrykerReport} from './report'

export interface TargetReport {
  target: StrykerTargetId
  packageDir: string
  report: StrykerReport
}

export function repositoryRelativePath(targetReport: TargetReport, fileName: string): string {
  const {packageDir, report} = targetReport
  const packageRelative =
    path.isAbsolute(fileName) && report.projectRoot !== undefined
      ? path.relative(report.projectRoot, fileName)
      : fileName
  return path.posix.join(packageDir, packageRelative.split(path.sep).join('/'))
}

/** Mutant ids by repo-relative file path that the exclusion register takes out of the score. */
export type ExcludedMutantIds = ReadonlyMap<string, ReadonlySet<string>>

/** Per-file counts across targets with repo-relative paths; a file in two reports is an error. */
export function mergeStrykerReports(
  targetReports: TargetReport[],
  excludedMutantIds: ExcludedMutantIds = new Map(),
): MutatedFileResult[] {
  const entries = targetReports.flatMap((targetReport) =>
    Object.entries(targetReport.report.files).map(([fileName, fileReport]) => {
      const filePath = repositoryRelativePath(targetReport, fileName)
      const excludedIds = excludedMutantIds.get(filePath)
      return {
        path: filePath,
        target: targetReport.target,
        counts: countMutantStatuses(
          fileReport.mutants.map((mutant) =>
            excludedIds?.has(mutant.id) ? 'Excluded' : mutant.status,
          ),
        ),
      }
    }),
  )
  const duplicates = entries
    .map((entry) => entry.path)
    .filter((entryPath, index, allPaths) => allPaths.indexOf(entryPath) !== index)
  if (duplicates.length > 0) {
    throw new Error(
      `Files mutated in more than one Stryker report: ${[...new Set(duplicates)].join(', ')}`,
    )
  }
  return entries.map((entry, index) => ({_key: `file-${index}`, ...entry}))
}
