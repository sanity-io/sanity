import {createHash} from 'node:crypto'
import path from 'node:path'

import {type StrykerMutantStatus} from '@repo/utils/engine-confidence'

import {readJsonFile} from './config'
import {engineConfidenceDirectory} from './paths'
import {
  type ExcludedMutantIds,
  repositoryRelativePath,
  type TargetReport,
} from './stryker/mergeReports'

/** A reviewed mutant that no test could tell from the original code, matched as the review recorded it. */
export interface ExclusionEntry {
  file: string
  mutatorName: string
  replacement: string
  originalSnippet: string
  /** Present when the same mutation repeats in the file; see `contextHashOf`. */
  contextHash?: string
  reason: string
}

export type ExclusionProblemKind = 'stale' | 'detected' | 'ignored' | 'ambiguous'

export interface ExclusionProblem {
  kind: ExclusionProblemKind
  entry: ExclusionEntry
}

export interface ExclusionOutcome {
  excludedMutantIds: ExcludedMutantIds
  problems: ExclusionProblem[]
}

interface LocatedMutant {
  filePath: string
  id: string
  status: StrykerMutantStatus
  mutatorName: string
  replacement: string
  originalSnippet: string
  contextHash: string
}

const MATCHABLE_STATUSES: readonly StrykerMutantStatus[] = [
  'Killed',
  'Timeout',
  'Survived',
  'NoCoverage',
  'Ignored',
]
const DETECTED_STATUSES: readonly StrykerMutantStatus[] = ['Killed', 'Timeout']
const CONTEXT_LINES = 2
const CONTEXT_HASH_LENGTH = 10

export function readExclusions(directory = engineConfidenceDirectory): ExclusionEntry[] {
  return readJsonFile<ExclusionEntry[]>(path.join(directory, 'exclusions.json'))
}

function normaliseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function lineOffsetsOf(lines: readonly string[]): number[] {
  return lines.reduce<number[]>(
    (offsets, line, index) => [...offsets, offsets[index] + line.length + 1],
    [0],
  )
}

function nonBlankContext(candidates: readonly string[]): string[] {
  return candidates
    .filter((line) => line.trim().length > 0)
    .slice(0, CONTEXT_LINES)
    .map(normaliseWhitespace)
}

/**
 * Identifies one occurrence of a repeated mutation by the lines around it, so the register
 * survives edits elsewhere in the file but goes stale when the surrounding code changes.
 */
export function contextHashOf(options: {
  lines: readonly string[]
  startLine: number
  endLine: number
  startOffset: number
  lineStartOffset: number
  originalSnippet: string
}): string {
  const {lines, startLine, endLine, startOffset, lineStartOffset, originalSnippet} = options
  const firstSnippetLine = originalSnippet.split('\n')[0]
  const startLineText = lines[startLine - 1]
  const occurrenceInLine = Array.from({length: startLineText.length}, (_, index) => index).filter(
    (index) =>
      startLineText.startsWith(firstSnippetLine, index) && lineStartOffset + index < startOffset,
  ).length
  const before = nonBlankContext(lines.slice(0, startLine - 1).reverse()).reverse()
  const after = nonBlankContext(lines.slice(endLine))
  const contextText = [
    before.join('\n'),
    normaliseWhitespace(startLineText),
    after.join('\n'),
    String(occurrenceInLine),
  ].join('\n')
  return createHash('sha1').update(contextText).digest('hex').slice(0, CONTEXT_HASH_LENGTH)
}

function locatedMutantsOf(targetReport: TargetReport): LocatedMutant[] {
  return Object.entries(targetReport.report.files).flatMap(([fileName, fileReport]) => {
    const {source} = fileReport
    if (source === undefined) return []
    const filePath = repositoryRelativePath(targetReport, fileName)
    const lines = source.split('\n')
    const offsets = lineOffsetsOf(lines)
    const matchable = fileReport.mutants.filter((mutant) =>
      MATCHABLE_STATUSES.includes(mutant.status),
    )
    return matchable.flatMap((mutant) => {
      const {location, replacement} = mutant
      if (location === undefined || replacement === undefined) return []
      const {start, end} = location
      const lineStartOffset = offsets[start.line - 1]
      const startOffset = lineStartOffset + start.column - 1
      const endOffset = offsets[end.line - 1] + end.column - 1
      const originalSnippet = source.slice(startOffset, endOffset)
      return [
        {
          filePath,
          id: mutant.id,
          status: mutant.status,
          mutatorName: mutant.mutatorName,
          replacement,
          originalSnippet,
          contextHash: contextHashOf({
            lines,
            startLine: start.line,
            endLine: end.line,
            startOffset,
            lineStartOffset,
            originalSnippet,
          }),
        },
      ]
    })
  })
}

function matchesEntry(entry: ExclusionEntry, mutant: LocatedMutant): boolean {
  return (
    mutant.filePath === entry.file &&
    mutant.mutatorName === entry.mutatorName &&
    mutant.replacement === entry.replacement &&
    mutant.originalSnippet === entry.originalSnippet &&
    (entry.contextHash === undefined || mutant.contextHash === entry.contextHash)
  )
}

function problemKindOf(matches: readonly LocatedMutant[]): ExclusionProblemKind | undefined {
  if (matches.length === 0) return 'stale'
  if (matches.length > 1) return 'ambiguous'
  const [match] = matches
  if (DETECTED_STATUSES.includes(match.status)) return 'detected'
  return match.status === 'Ignored' ? 'ignored' : undefined
}

/**
 * Decides which survived or uncovered mutants the register takes out of the score. An entry that
 * matches no mutant, is ambiguous, is already ignored by the rules or matches a mutant a test
 * detected is a problem the run must fail on.
 */
export function matchExclusions(
  targetReports: readonly TargetReport[],
  entries: readonly ExclusionEntry[],
): ExclusionOutcome {
  const mutants = targetReports.flatMap(locatedMutantsOf)
  const resolved = entries.map((entry) => {
    const matches = mutants.filter((mutant) => matchesEntry(entry, mutant))
    return {entry, matches, kind: problemKindOf(matches)}
  })
  const excludedMutantIds = resolved
    .filter((outcome) => outcome.kind === undefined)
    .reduce((byFile, {matches: [match]}) => {
      const ids = new Set(byFile.get(match.filePath))
      return new Map(byFile).set(match.filePath, ids.add(match.id))
    }, new Map<string, ReadonlySet<string>>())
  const problems = resolved.flatMap(({entry, kind}) => (kind === undefined ? [] : [{kind, entry}]))
  return {excludedMutantIds, problems}
}

const PROBLEM_ADVICE: Record<ExclusionProblemKind, string> = {
  stale: 'matches no mutant, so the code changed: re-review it, then update or remove the entry',
  detected: 'matches a mutant a test detected, so it can be caught: remove the entry',
  ignored: 'matches a mutant the ignore rules already skip: remove the entry',
  ambiguous: 'matches more than one mutant: add a contextHash that tells them apart',
}

function abbreviated(text: string): string {
  const singleLine = normaliseWhitespace(text)
  return singleLine.length > 60 ? `${singleLine.slice(0, 57)}...` : singleLine
}

export function describeExclusionProblems(problems: readonly ExclusionProblem[]): string[] {
  return problems.map(
    ({kind, entry}) =>
      `${entry.file} ${entry.mutatorName} \`${abbreviated(entry.originalSnippet)}\` -> \`${abbreviated(entry.replacement)}\`: ${PROBLEM_ADVICE[kind]}`,
  )
}

export class ExclusionRegisterError extends Error {
  readonly problems: ExclusionProblem[]

  constructor(problems: ExclusionProblem[]) {
    super(
      [
        `Exclusion register check failed, ${problems.length} problem${problems.length === 1 ? '' : 's'}:`,
        ...describeExclusionProblems(problems).map((line) => `  ${line}`),
      ].join('\n'),
    )
    this.name = 'ExclusionRegisterError'
    this.problems = problems
  }
}
