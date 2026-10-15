import {readFileSync} from 'node:fs'

import {describe, expect, it} from 'vitest'

import {MEMORY_ADDITION_KEYS, type SqrlRun, type SqrlScenario, SQRL_INPUTS} from './inputs'
import {
  eventsInWindow,
  RELIABILITY_REFERENCE_COUNT,
  RELIABILITY_REFERENCE_END_DAY,
  reliabilityEvents,
  type SqrlTag,
} from './reliability'
import {computeSqrlScores, type SqrlScoreDocument} from './score'

/**
 * Fixtures are the fields the engine reads from the Radar dataset on 2026-10-15
 * (150 main runs, 107 shas, stable tags); goldenScores.tsv holds the per-commit
 * scores recorded when formula version 1 was agreed. Tab-separated, one row per
 * document; a benchRuns column is `scenario|kind|mode|field`, and an empty cell
 * is a missing value.
 */
function tsvRows(name: string): Record<string, string>[] {
  const [header, ...lines] = readFileSync(
    new URL(`./__fixtures__/${name}`, import.meta.url),
    'utf8',
  )
    .trimEnd()
    .split('\n')
    .map((line) => line.split('\t'))
  return lines.map((cells) =>
    Object.fromEntries(header.map((column, index) => [column, cells[index]])),
  )
}

function optionalNumber(cell: string | undefined): number | null {
  return cell ? Number(cell) : null
}

function scenarioFromCells(
  identity: string,
  cells: [field: string, value: number][],
): SqrlScenario {
  const [scenario, kind, mode] = identity.split('|')
  const metricLabels = [
    ...new Set(cells.flatMap(([field]) => (field.includes(':') ? [field.split(':')[1]] : []))),
  ]
  const valueOf = (field: string) => cells.find(([candidate]) => candidate === field)?.[1] ?? null
  const resources = cells.filter(([field]) => field.startsWith('resources:'))
  const soak = cells.filter(([field]) => field.startsWith('soak:'))
  return {
    scenario,
    kind,
    mode: mode || null,
    calibrationMs: valueOf('calibrationMs'),
    metrics: metricLabels
      .filter((label) => cells.some(([field]) => field === `median:${label}`))
      .map((label) => ({label, median: valueOf(`median:${label}`), p75: valueOf(`p75:${label}`)})),
    resources:
      resources.length > 0
        ? Object.fromEntries(resources.map(([field, value]) => [field.split(':')[1], value]))
        : null,
    soak:
      soak.length > 0
        ? soak.map(([field, value]) => ({minute: Number(field.split(':')[1]), heapMb: value}))
        : null,
  }
}

const runs: SqrlRun[] = tsvRows('benchRuns.tsv').map((row) => {
  const byScenario = Object.entries(row)
    .filter(([column, cell]) => column.includes('|') && cell !== '')
    .reduce((groups, [column, cell]) => {
      const separator = column.lastIndexOf('|')
      const identity = column.slice(0, separator)
      groups.set(identity, [
        ...(groups.get(identity) ?? []),
        [column.slice(separator + 1), Number(cell)],
      ])
      return groups
    }, new Map<string, [string, number][]>())
  return {
    _id: row._id,
    startedAt: row.startedAt,
    git: {sha: row.sha, committedAt: row.committedAt || null},
    totalJsBytes: optionalNumber(row.totalJsBytes),
    scenarios: [...byScenario].map(([identity, cells]) => scenarioFromCells(identity, cells)),
  }
})

const tags: SqrlTag[] = tsvRows('gitTags.tsv').map((row) => ({
  tag: row.tag,
  major: Number(row.major),
  minor: Number(row.minor),
  patch: Number(row.patch),
  prerelease: null,
  taggedAt: row.taggedAt,
  publishedAt: row.publishedAt || null,
  deprecated: row.deprecated || null,
}))

interface ReferencePoint {
  sha: string
  score: number
  scoreCommit: number
  scoreRaw: number
}

const referenceRows = tsvRows('goldenScores.tsv')
const reference: Record<'withoutMemoryAdditionsNoDedupe' | 'formulaVersion1', ReferencePoint[]> = {
  formulaVersion1: referenceRows.map((row) => ({
    sha: row.sha,
    score: Number(row.score),
    scoreCommit: Number(row.scoreCommit),
    scoreRaw: Number(row.scoreRaw),
  })),
  withoutMemoryAdditionsNoDedupe: referenceRows.map((row) => ({
    sha: row.sha,
    score: Number(row.noDedupeScore),
    scoreCommit: Number(row.noDedupeScoreCommit),
    scoreRaw: Number(row.noDedupeScoreRaw),
  })),
}

const MEMORY_ADDITIONS = new Set<string>(MEMORY_ADDITION_KEYS)
const inputsWithoutMemoryAdditions = SQRL_INPUTS.filter((input) => !MEMORY_ADDITIONS.has(input.key))

const COMPUTED_AT = '2026-10-15T12:00:00.000Z'
const formulaVersion1 = computeSqrlScores(runs, tags, {computedAt: COMPUTED_AT})
const withoutMemoryAdditionsNoDedupe = computeSqrlScores(runs, tags, {
  computedAt: COMPUTED_AT,
  dedupeClusters: false,
  inputs: inputsWithoutMemoryAdditions,
})
const withoutMemoryAdditions = computeSqrlScores(runs, tags, {
  computedAt: COMPUTED_AT,
  inputs: inputsWithoutMemoryAdditions,
})

function scoreAtMonthStart(documents: SqrlScoreDocument[], month: number): number | undefined {
  const cutoff = Date.UTC(2026, month - 1, 1)
  return documents.findLast((document) => Date.parse(document.git.committedAt) < cutoff)?.score
}

function inputOf(document: SqrlScoreDocument | undefined, key: string) {
  return document?.inputs.find((input) => input.key === key)
}

describe('parity with the golden formula version 1 scores', () => {
  it('merges the 150 runs into the same 107 commits, in the same order', () => {
    expect(formulaVersion1.map((document) => document.git.sha)).toEqual(
      reference.formulaVersion1.map((point) => point.sha),
    )
  })

  it('reproduces the agreed headline of 94.5 before the Memory additions, without cluster dedupe', () => {
    const latest = withoutMemoryAdditionsNoDedupe.at(-1)
    expect(latest?.score).toBeCloseTo(94.5343, 3)
    expect(latest?.scoreCommit).toBeCloseTo(98.4492, 3)
    expect(latest?.scoreRaw).toBeCloseTo(121.7611, 3)
    expect(latest?.reliability.count).toBe(5)
  })

  it('reproduces the monthly values of the agreed configuration', () => {
    expect(scoreAtMonthStart(withoutMemoryAdditionsNoDedupe, 7)).toBeCloseTo(103.5681, 3)
    expect(scoreAtMonthStart(withoutMemoryAdditionsNoDedupe, 8)).toBeCloseTo(105.9011, 3)
    expect(scoreAtMonthStart(withoutMemoryAdditionsNoDedupe, 9)).toBeCloseTo(85.6717, 3)
    expect(scoreAtMonthStart(withoutMemoryAdditionsNoDedupe, 10)).toBeCloseTo(93.2889, 3)
  })

  it('reproduces the deduped headline before the Memory additions', () => {
    const latest = withoutMemoryAdditions.at(-1)
    expect(latest?.score).toBeCloseTo(103.4483, 3)
    expect(latest?.reliability.count).toBe(2)
  })

  it('reproduces the formula version 1 headline and monthly values', () => {
    const latest = formulaVersion1.at(-1)
    expect(latest?.score).toBeCloseTo(103.9647, 3)
    expect(latest?.scoreCommit).toBeCloseTo(108.6747, 3)
    expect(latest?.scoreRaw).toBeCloseTo(134.3952, 3)
    expect(scoreAtMonthStart(formulaVersion1, 7)).toBeCloseTo(101.9813, 3)
    expect(scoreAtMonthStart(formulaVersion1, 8)).toBeCloseTo(105.2253, 3)
    expect(scoreAtMonthStart(formulaVersion1, 9)).toBeCloseTo(89.257, 3)
    expect(scoreAtMonthStart(formulaVersion1, 10)).toBeCloseTo(103.0291, 3)
  })

  it.each([
    ['formulaVersion1', formulaVersion1],
    ['withoutMemoryAdditionsNoDedupe', withoutMemoryAdditionsNoDedupe],
  ] as const)('matches every per-commit score of %s', (name, documents) => {
    const deviations = documents.map((document, index) => {
      const expected = reference[name][index]
      return Math.max(
        Math.abs(document.score - expected.score),
        Math.abs(document.scoreCommit - expected.scoreCommit),
        Math.abs(document.scoreRaw - expected.scoreRaw),
      )
    })
    expect(Math.max(...deviations)).toBeLessThan(1e-6)
  })

  it.each([
    ['articleInp', 409.9979587670763, 364, 1.126368018590869, 0.175],
    ['keystrokeMedian', 103.7676723903146, 88.98220654742101, 1.1661620498814447, 0.065],
    ['timeToEditableCold', 6531.213875757598, 6447.230182954388, 1.0130263214465727, 0.01625],
    ['settleCpu', 424.9709715982771, 2747.924621394916, 0.15465161172527037, 0.0325],
    ['pageCss', 856515, 330892, 2.5885031974178863, 0.01625],
    ['cls', 0.036224394904242625, 0.010094032287597659, 3.5886941781185735, 0.01625],
    ['soakHeapGrowth', 0.668008900737879, 0.5084528933526251, 1.3138068628800146, 0.01625],
    ['requestCount', 203.92250424900413, 166.3177877224901, 1.2261015916665479, 0.01625],
  ])(
    'matches the %s reference, value, ratio and weight today',
    (key, referenceValue, value, ratio, weight) => {
      const input = inputOf(formulaVersion1.at(-1), key)
      expect(input?.referenceValue).toBeCloseTo(referenceValue, 6)
      expect(input?.value).toBeCloseTo(value, 6)
      expect(input?.ratio).toBeCloseTo(ratio, 7)
      expect(input?.weight).toBeCloseTo(weight, 12)
    },
  )
})

function soakScenario(scenario: string, heapPerMinute: number): SqrlScenario {
  return {
    scenario,
    kind: 'interaction',
    mode: 'soak',
    soak: Array.from({length: 11}, (_, minute) => ({minute, heapMb: 30 + heapPerMinute * minute})),
  }
}

function soakGrowthOf(scenarios: SqrlScenario[]): number | undefined {
  const run: SqrlRun = {
    _id: 'bench-run-soak',
    startedAt: '2026-10-16T05:00:00Z',
    git: {sha: 'soak'},
    scenarios,
  }
  return SQRL_INPUTS.find((input) => input.key === 'soakHeapGrowth')?.extract(run)?.[0]?.value
}

describe('soak heap growth', () => {
  it.each([
    ['singleString first', [soakScenario('singleString', 0.5), soakScenario('article', 4)]],
    ['article first', [soakScenario('article', 4), soakScenario('singleString', 0.5)]],
  ])('reads the singleString soak with %s', (_, scenarios) => {
    expect(soakGrowthOf(scenarios)).toBeCloseTo(0.5, 12)
  })

  it('is missing when only another scenario was soaked', () => {
    expect(soakGrowthOf([soakScenario('article', 4)])).toBeUndefined()
  })
})

describe('reliability', () => {
  it('derives the frozen reference count from the tag history', () => {
    const events = reliabilityEvents(tags, {dedupeClusters: true})
    expect(eventsInWindow(events, RELIABILITY_REFERENCE_END_DAY)).toHaveLength(
      RELIABILITY_REFERENCE_COUNT,
    )
  })

  it('counts a deprecated hot-patch once, inside its cluster', () => {
    const today = '2026-10-14'
    const deduped = eventsInWindow(reliabilityEvents(tags, {dedupeClusters: true}), today)
    const literal = eventsInWindow(reliabilityEvents(tags, {dedupeClusters: false}), today)
    expect(literal.map((event) => event.tag)).toEqual(
      expect.arrayContaining(['v6.10.1', 'v6.13.1', 'v6.13.2']),
    )
    expect(deduped.map((event) => event.tag)).toEqual(
      expect.not.arrayContaining(['v6.10.1', 'v6.13.1', 'v6.13.2']),
    )
    expect(literal).toHaveLength(5)
    expect(deduped).toHaveLength(2)
  })
})

describe('document shape', () => {
  const latest = formulaVersion1.at(-1)

  it('identifies the document by sha and records its provenance', () => {
    expect(latest?._id).toBe(`sqrl-score-${latest?.git.sha}`)
    expect(latest?._type).toBe('sqrlScore')
    expect(latest?.formulaVersion).toBe(1)
    expect(latest?.computedAt).toBe(COMPUTED_AT)
    expect(latest?.git.branch).toBe('main')
    expect(latest?.benchRunIds.length).toBeGreaterThan(0)
  })

  it('weights INP at 0.35 and shares the rest equally across the other five pillars', () => {
    const weights = Object.fromEntries(
      latest?.pillars.map((pillar) => [pillar.key, pillar.weight]) ?? [],
    )
    expect(weights.inp).toBeCloseTo(0.35, 12)
    expect(Object.keys(weights)).toEqual([
      'inp',
      'responsiveness',
      'load',
      'cpu',
      'memory',
      'reliability',
    ])
    for (const pillar of ['responsiveness', 'load', 'cpu', 'memory', 'reliability']) {
      expect(weights[pillar]).toBeCloseTo(0.13, 12)
    }
    const inputWeightTotal = latest?.inputs.reduce((total, input) => total + input.weight, 0)
    expect(inputWeightTotal).toBeCloseTo(1, 12)
  })

  it('rebases pillars to the reference window, so their direction agrees with their points', () => {
    const pillars = latest?.pillars ?? []
    const reliability = pillars.find((pillar) => pillar.key === 'reliability')
    expect(reliability?.score).toBeCloseTo(100, 6)
    const disagreeing = pillars.filter((pillar) => {
      const points = (latest?.inputs ?? [])
        .filter((input) => input.pillar === pillar.key)
        .reduce((total, input) => total + input.contributionPoints, 0)
      return Math.abs(pillar.score - 100) > 1 && Math.sign(pillar.score - 100) !== Math.sign(points)
    })
    expect(disagreeing).toEqual([])
  })

  it('splits the distance from 100 exactly across the inputs', () => {
    const points = latest?.inputs.reduce((total, input) => total + input.contributionPoints, 0) ?? 0
    expect(points).toBeCloseTo((latest?.score ?? 0) - 100, 9)
  })

  it('reports reliability as counts with their events', () => {
    expect(latest?.reliability).toMatchObject({windowWeeks: 13, count: 2, referenceCount: 4})
    expect(latest?.reliability.events).toHaveLength(2)
    expect(inputOf(latest, 'reliability')).toMatchObject({
      unit: 'events',
      value: 3,
      referenceValue: 5,
    })
  })

  it('gives every input a trend from the drift rule', () => {
    const trends = new Set(latest?.inputs.map((input) => input.trend))
    expect(
      [...trends].every((trend) => ['regression', 'improvement', 'neutral'].includes(trend)),
    ).toBe(true)
    expect(inputOf(formulaVersion1[3], 'articleInp')?.trend).toBe('insufficient')
  })

  it('lists an input only from the first commit that measured it', () => {
    const firstWithToolVisible = formulaVersion1.findIndex((document) =>
      inputOf(document, 'toolVisible'),
    )
    expect(formulaVersion1[firstWithToolVisible].git.committedAt.slice(0, 10)).toBe('2026-09-23')
    expect(inputOf(formulaVersion1[firstWithToolVisible - 1], 'toolVisible')).toBeUndefined()
  })
})
