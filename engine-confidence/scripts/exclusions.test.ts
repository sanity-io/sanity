import {type StrykerMutantStatus} from '@repo/utils/engine-confidence'
import {describe, expect, test} from 'vitest'

import {
  contextHashOf,
  describeExclusionProblems,
  type ExclusionEntry,
  ExclusionRegisterError,
  matchExclusions,
  readExclusions,
} from './exclusions'
import {mergeStrykerReports, type TargetReport} from './stryker/mergeReports'
import {type StrykerMutant} from './stryker/report'

const SOURCE = [
  'export function pick(items: string[], fallback: string[]) {',
  '  const first = items.length > 0 ? items : []',
  '  const second = fallback.length > 0 ? fallback : []',
  '  return [...first, ...second]',
  '}',
].join('\n')

function locationOf(snippet: string, occurrence: number) {
  const startOffset = SOURCE.split(snippet).slice(0, occurrence).join(snippet).length
  const before = SOURCE.slice(0, startOffset).split('\n')
  const line = before.length
  const column = before[before.length - 1].length + 1
  return {start: {line, column}, end: {line, column: column + snippet.length}}
}

function emptyArrayMutant(
  id: string,
  occurrence: number,
  status: StrykerMutantStatus,
): StrykerMutant {
  return {
    id,
    mutatorName: 'ArrayDeclaration',
    replacement: '["Stryker was here"]',
    status,
    location: locationOf('[]', occurrence),
  }
}

function targetReportOf(mutants: StrykerMutant[]): TargetReport {
  return {
    target: 'mutator',
    packageDir: 'packages/@sanity/mutator',
    report: {files: {'src/pick.ts': {source: SOURCE, mutants}}},
  }
}

const FILE = 'packages/@sanity/mutator/src/pick.ts'

function entryOf(overrides: Partial<ExclusionEntry> = {}): ExclusionEntry {
  return {
    file: FILE,
    mutatorName: 'ArrayDeclaration',
    replacement: '["Stryker was here"]',
    originalSnippet: '[]',
    reason: 'The fallback is never read',
    ...overrides,
  }
}

function secondOccurrenceHash(): string {
  const lines = SOURCE.split('\n')
  const location = locationOf('[]', 2)
  const lineStartOffset = lines.slice(0, location.start.line - 1).join('\n').length + 1
  return contextHashOf({
    lines,
    startLine: location.start.line,
    endLine: location.end.line,
    startOffset: lineStartOffset + location.start.column - 1,
    lineStartOffset,
    originalSnippet: '[]',
  })
}

describe('matchExclusions', () => {
  test('excludes a survived mutant the register names', () => {
    const outcome = matchExclusions(
      [targetReportOf([emptyArrayMutant('7', 1, 'Survived')])],
      [entryOf({contextHash: undefined})],
    )

    expect(outcome.problems).toEqual([])
    expect(outcome.excludedMutantIds.get(FILE)).toEqual(new Set(['7']))
  })

  test('excludes an uncovered mutant too', () => {
    const outcome = matchExclusions(
      [targetReportOf([emptyArrayMutant('7', 1, 'NoCoverage')])],
      [entryOf()],
    )

    expect(outcome.problems).toEqual([])
    expect(outcome.excludedMutantIds.get(FILE)).toEqual(new Set(['7']))
  })

  test('tells repeated mutations apart by context hash', () => {
    const mutants = [emptyArrayMutant('1', 1, 'Survived'), emptyArrayMutant('2', 2, 'Survived')]

    const ambiguous = matchExclusions([targetReportOf(mutants)], [entryOf()])
    const pinned = matchExclusions(
      [targetReportOf(mutants)],
      [entryOf({contextHash: secondOccurrenceHash()})],
    )

    expect(ambiguous.problems.map((problem) => problem.kind)).toEqual(['ambiguous'])
    expect(pinned.problems).toEqual([])
    expect(pinned.excludedMutantIds.get(FILE)).toEqual(new Set(['2']))
  })

  test('reports an entry that matches no mutant as stale', () => {
    const outcome = matchExclusions(
      [targetReportOf([emptyArrayMutant('7', 1, 'Survived')])],
      [entryOf({originalSnippet: '[0]'}), entryOf({file: 'packages/@sanity/mutator/src/gone.ts'})],
    )

    expect(outcome.problems.map((problem) => problem.kind)).toEqual(['stale', 'stale'])
    expect(outcome.excludedMutantIds.size).toBe(0)
  })

  test('reports an entry whose context changed as stale', () => {
    const outcome = matchExclusions(
      [targetReportOf([emptyArrayMutant('2', 2, 'Survived')])],
      [entryOf({contextHash: 'deadbeef00'})],
    )

    expect(outcome.problems.map((problem) => problem.kind)).toEqual(['stale'])
  })

  test.each<StrykerMutantStatus>(['Killed', 'Timeout'])(
    'reports an entry whose mutant a test %s as detected and does not exclude it',
    (status) => {
      const outcome = matchExclusions(
        [targetReportOf([emptyArrayMutant('7', 1, status)])],
        [entryOf()],
      )

      expect(outcome.problems.map((problem) => problem.kind)).toEqual(['detected'])
      expect(outcome.excludedMutantIds.size).toBe(0)
    },
  )

  test('reports an entry for a mutant the ignore rules already skip', () => {
    const outcome = matchExclusions(
      [targetReportOf([emptyArrayMutant('7', 1, 'Ignored')])],
      [entryOf()],
    )

    expect(outcome.problems.map((problem) => problem.kind)).toEqual(['ignored'])
  })

  test('reads nothing from a report without sources', () => {
    const outcome = matchExclusions(
      [{...targetReportOf([]), report: {files: {'src/pick.ts': {mutants: []}}}}],
      [entryOf()],
    )

    expect(outcome.problems.map((problem) => problem.kind)).toEqual(['stale'])
  })
})

describe('mergeStrykerReports with exclusions', () => {
  test('moves excluded mutants out of survived and noCoverage into excluded', () => {
    const targetReport = targetReportOf([
      emptyArrayMutant('1', 1, 'Survived'),
      emptyArrayMutant('2', 2, 'NoCoverage'),
      {...emptyArrayMutant('3', 1, 'Killed'), mutatorName: 'ConditionalExpression'},
    ])

    const [file] = mergeStrykerReports([targetReport], new Map([[FILE, new Set(['1', '2'])]]))

    expect(file.counts).toMatchObject({killed: 1, survived: 0, noCoverage: 0, excluded: 2})
  })
})

describe('ExclusionRegisterError', () => {
  test('lists every entry that no longer fits with what to do about it', () => {
    const problems = [
      {kind: 'stale' as const, entry: entryOf({originalSnippet: '[0]'})},
      {kind: 'detected' as const, entry: entryOf()},
    ]

    const error = new ExclusionRegisterError(problems)

    expect(error.message).toContain('2 problems')
    expect(describeExclusionProblems(problems)).toEqual([
      expect.stringContaining('`[0]` -> `["Stryker was here"]`: matches no mutant'),
      expect.stringContaining('a test detected, so it can be caught: remove the entry'),
    ])
    expect(error.message).toContain(describeExclusionProblems(problems)[0])
  })
})

describe('contextHashOf', () => {
  test('is a ten character hex digest that depends on the surrounding lines', () => {
    expect(secondOccurrenceHash()).toMatch(/^[0-9a-f]{10}$/)
    expect(secondOccurrenceHash()).not.toBe(
      contextHashOf({
        lines: SOURCE.replace('return', 'yield').split('\n'),
        startLine: 3,
        endLine: 3,
        startOffset: 0,
        lineStartOffset: 0,
        originalSnippet: '[]',
      }),
    )
  })
})

describe('the committed register', () => {
  test('has the reviewed entries, each with a reason and no duplicates', () => {
    const entries = readExclusions()

    expect(entries).toHaveLength(201)
    expect(entries.every((entry) => entry.reason.length > 0)).toBe(true)
    const keys = entries.map((entry) =>
      JSON.stringify([
        entry.file,
        entry.mutatorName,
        entry.replacement,
        entry.originalSnippet,
        entry.contextHash,
      ]),
    )
    expect(new Set(keys).size).toBe(entries.length)
  })
})
