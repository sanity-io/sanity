import {readFileSync} from 'node:fs'
import path from 'node:path'

import {isoWeekOf} from '@repo/utils/engine-confidence'
import {describe, expect, test} from 'vitest'

import {type CatalogueResultsFile} from './catalogue/results'
import {
  buildRunDocument,
  renderSummary,
  type ScoreInputs,
  type StrykerTargetInput,
} from './computeScore'
import {readPinnedConfig} from './config'
import {ExclusionRegisterError} from './exclusions'
import {type StrykerReport, type StrykerRunMeta} from './stryker/report'

function fixture(name: string): StrykerReport {
  return JSON.parse(
    readFileSync(path.join(import.meta.dirname, '__fixtures__', name), 'utf8'),
  ) as StrykerReport
}

function runMeta(target: StrykerRunMeta['target']): StrykerRunMeta {
  return {
    target,
    mode: 'full',
    reusedMutants: 0,
    dryRunTests: 100,
    durationMs: 60_000,
    configVersion: 1,
    configHash: 'hash',
  }
}

const strykerTargets: StrykerTargetInput[] = [
  {
    target: 'sanity',
    packageDir: 'packages/sanity',
    report: fixture('sanity-trimmed.stryker.json'),
    meta: runMeta('sanity'),
  },
  {
    target: 'mutator',
    packageDir: 'packages/@sanity/mutator',
    report: fixture('mutator-trimmed.stryker.json'),
    meta: runMeta('mutator'),
  },
]

const catalogue: CatalogueResultsFile = {
  repoHead: 'head',
  startedAt: '2026-10-15T03:00:00.000Z',
  completedAt: '2026-10-15T03:30:00.000Z',
  fuzzSeeds: [1, 2, 3],
  fuzzRuns: 150,
  suitesRun: ['unit:mutator', 'unit:engine', 'fuzz:pt'],
  inertEntries: [],
  suiteTimings: [],
  entries: [
    {
      _key: 'entry-0',
      id: 'ENG-001',
      title: 'Caught entry',
      severity: 'S1',
      failureClass: 'class',
      addedOn: '2026-10-16',
      results: [
        {_key: 'suite-0', suite: 'unit:mutator', status: 'not-applicable'},
        {_key: 'suite-1', suite: 'unit:engine', status: 'caught', failingTests: ['a > b']},
        {_key: 'suite-2', suite: 'fuzz:pt', status: 'missed'},
        {_key: 'suite-3', suite: 'e2e', status: 'not-run'},
      ],
    },
    {
      _key: 'entry-1',
      id: 'ENG-005',
      title: 'Missed entry',
      severity: 'S1',
      failureClass: 'class',
      addedOn: '2026-10-16',
      results: [
        {_key: 'suite-0', suite: 'unit:mutator', status: 'not-applicable'},
        {_key: 'suite-1', suite: 'unit:engine', status: 'missed'},
        {_key: 'suite-2', suite: 'fuzz:pt', status: 'not-applicable'},
        {_key: 'suite-3', suite: 'e2e', status: 'not-run'},
      ],
    },
  ],
}

function scoreInputs(overrides: Partial<ScoreInputs> = {}): ScoreInputs {
  return {
    strykerTargets,
    catalogue,
    exclusions: [],
    pinnedConfig: readPinnedConfig(),
    configHash: 'hash',
    strykerVersion: '10.0.0',
    vitestVersion: '5.0.4',
    startedAt: new Date('2026-10-15T03:00:00.000Z'),
    completedAt: new Date('2026-10-15T04:00:00.000Z'),
    trigger: 'local',
    git: {sha: 'a'.repeat(40), branch: 'main'},
    runner: {os: 'linux', arch: 'x64', cpus: 4, memGb: 16, nodeVersion: 'v24.0.0', ci: false},
    ...overrides,
  }
}

const EXCLUDED_SOURCE = 'export const empty = []\n'

function emptyFileTarget(
  target: StrykerRunMeta['target'],
  packageDir: string,
  status: 'Survived' | 'Killed',
): StrykerTargetInput {
  return {
    target,
    packageDir,
    meta: runMeta(target),
    report: {
      files: {
        'src/empty.ts': {
          source: EXCLUDED_SOURCE,
          mutants: [
            {
              id: '0',
              mutatorName: 'ArrayDeclaration',
              replacement: '["Stryker was here"]',
              status,
              location: {start: {line: 1, column: 22}, end: {line: 1, column: 24}},
            },
            {
              id: '1',
              mutatorName: 'ObjectLiteral',
              replacement: '{}',
              status: 'Killed',
              location: {start: {line: 1, column: 22}, end: {line: 1, column: 24}},
            },
          ],
        },
      },
    },
  }
}

function mutatorTargetWith(status: 'Survived' | 'Killed'): StrykerTargetInput {
  return emptyFileTarget('mutator', 'packages/@sanity/mutator', status)
}

const emptyArrayExclusion = {
  file: 'packages/@sanity/mutator/src/empty.ts',
  mutatorName: 'ArrayDeclaration',
  replacement: '["Stryker was here"]',
  originalSnippet: '[]',
  reason: 'Never read',
}

describe('buildRunDocument', () => {
  test('files the run under the ISO week of its start', () => {
    const document = buildRunDocument(scoreInputs())

    expect(document._id).toBe('engine-confidence-run-2026-w42')
    expect(document.isoWeek).toBe(isoWeekOf(new Date('2026-10-15T03:00:00.000Z')))
    expect(document._type).toBe('engineConfidenceRun')
    expect(document.schemaVersion).toBe(2)
  })

  test('scores the mutation score from the merged Stryker reports', () => {
    const {score} = buildRunDocument(scoreInputs())

    expect(score).toMatchObject({
      status: 'measured',
      counts: {killed: 23, survived: 4, noCoverage: 17},
    })
    if (score.status === 'measured') {
      expect(score.ratio).toBeCloseTo(23 / 44)
      expect(score.coveredRatio).toBeCloseTo(23 / 27)
      expect(score.files.map((file) => file._key)).toEqual(['file-0', 'file-1', 'file-2', 'file-3'])
      expect(score.targets.map((target) => target._key)).toEqual(['target-0', 'target-1'])
    }
  })

  test('scores the core Studio engine from the sanity files only', () => {
    const {score, studioScore} = buildRunDocument(scoreInputs())

    expect(studioScore).toMatchObject({
      status: 'measured',
      counts: {killed: 8, survived: 2, noCoverage: 17},
    })
    if (studioScore.status === 'measured' && score.status === 'measured') {
      expect(studioScore.ratio).toBeCloseTo(8 / 27)
      expect(studioScore.coveredRatio).toBeCloseTo(8 / 10)
      expect(studioScore.ratio).not.toBeCloseTo(score.ratio)
      expect(studioScore).not.toHaveProperty('files')
      expect(studioScore).not.toHaveProperty('targets')
    }
  })

  test('leaves reviewed exclusions out of the core Studio engine score', () => {
    const [, mutatorTarget] = strykerTargets
    const studioTarget = emptyFileTarget('sanity', 'packages/sanity', 'Survived')
    const exclusion = {
      ...emptyArrayExclusion,
      file: 'packages/sanity/src/empty.ts',
      contextHash: undefined,
    }
    const withRegister = buildRunDocument(
      scoreInputs({strykerTargets: [studioTarget, mutatorTarget], exclusions: [exclusion]}),
    ).studioScore
    const withoutRegister = buildRunDocument(
      scoreInputs({strykerTargets: [studioTarget, mutatorTarget]}),
    ).studioScore

    expect(withRegister).toMatchObject({
      status: 'measured',
      ratio: 1,
      counts: {excluded: 1, survived: 0, killed: 1},
    })
    expect(withoutRegister).toMatchObject({
      status: 'measured',
      ratio: 0.5,
      counts: {excluded: 0, survived: 1, killed: 1},
    })
  })

  test('counts reviewed exclusions apart from ignored and leaves them out of the ratio', () => {
    const [sanityTarget] = strykerTargets
    const withRegister = buildRunDocument(
      scoreInputs({
        strykerTargets: [sanityTarget, mutatorTargetWith('Survived')],
        exclusions: [{...emptyArrayExclusion, contextHash: undefined}],
      }),
    ).score
    const withoutRegister = buildRunDocument(
      scoreInputs({strykerTargets: [sanityTarget, mutatorTargetWith('Survived')]}),
    ).score

    expect(withRegister).toMatchObject({status: 'measured', counts: {excluded: 1, ignored: 0}})
    expect(withoutRegister).toMatchObject({status: 'measured', counts: {excluded: 0, survived: 3}})
    if (withRegister.status === 'measured' && withoutRegister.status === 'measured') {
      expect(withRegister.counts.survived).toBe(withoutRegister.counts.survived - 1)
      expect(withRegister.ratio).toBeGreaterThan(withoutRegister.ratio)
    }
  })

  test('fails when a register entry matches no mutant', () => {
    expect(() => buildRunDocument(scoreInputs({exclusions: [emptyArrayExclusion]}))).toThrow(
      ExclusionRegisterError,
    )
  })

  test('fails when a register entry matches a mutant a test detected', () => {
    const [sanityTarget] = strykerTargets
    expect(() =>
      buildRunDocument(
        scoreInputs({
          strykerTargets: [sanityTarget, mutatorTargetWith('Killed')],
          exclusions: [{...emptyArrayExclusion, contextHash: undefined}],
        }),
      ),
    ).toThrow(/a test detected/)
  })

  test('reports known bugs as caught by at least one suite, kept apart from the score', () => {
    const {knownBugs} = buildRunDocument(scoreInputs())

    expect(knownBugs).toMatchObject({
      status: 'measured',
      activeEntries: 2,
      caughtEntries: 1,
    })
    expect(knownBugs).not.toHaveProperty('ratio')
  })

  test('reports known bugs as not measured when there are no catalogue results', () => {
    const document = buildRunDocument(scoreInputs({catalogue: undefined}))

    expect(document.knownBugs).toEqual({
      status: 'not-measured',
      reason: 'No catalogue results were found',
    })
  })

  test('reports the score as not measured when a target has no report', () => {
    const document = buildRunDocument(scoreInputs({strykerTargets: [strykerTargets[0]]}))

    expect(document.score).toEqual({
      status: 'not-measured',
      reason: 'No Stryker report for target: mutator',
    })
  })

  test('reports the core Studio engine score as not measured with the same reason when the score is not', () => {
    const document = buildRunDocument(scoreInputs({strykerTargets: [strykerTargets[0]]}))

    expect(document.studioScore).toEqual({
      status: 'not-measured',
      reason: 'No Stryker report for target: mutator',
    })
  })

  test('copies the pinned config into the document', () => {
    const document = buildRunDocument(scoreInputs())

    expect(document.config).toMatchObject({
      version: 1,
      hash: 'hash',
      strykerVersion: '10.0.0',
      vitestVersion: '5.0.4',
      fuzzSeeds: [1, 2, 3],
      fuzzRuns: 150,
    })
  })
})

describe('renderSummary', () => {
  test('puts both scores and the known bugs count in a markdown table', () => {
    const summary = renderSummary(buildRunDocument(scoreInputs()))

    expect(summary).toContain('### Engine confidence 2026-W42')
    expect(summary).toContain('Total engine: **52.3%** · Core Studio engine: **29.6%** (config v1)')
    expect(summary).toContain(
      '| Total engine score (Studio + @sanity/mutator) | 52.3% (23 detected',
    )
    expect(summary).toContain('| Core Studio engine score | 29.6% (8 detected, 19 missed')
    expect(summary).toContain('0 ignored by rule, 0 excluded after review')
    expect(summary).toContain('| Known bugs caught (not part of the score) | 1/2 |')
  })
})
