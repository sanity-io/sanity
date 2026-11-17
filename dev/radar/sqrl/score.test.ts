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
        ? {
            samples: soak.map(([field, value]) => ({
              minute: Number(field.split(':')[1]),
              heapMb: value,
            })),
          }
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

const ARTICLE_SOAK_KEYS = [
  'articleSoakHeapGrowth',
  'articleSoakListenerGrowth',
  'articleSoakDomGrowth',
] as const

interface SoakRates {
  heapMb: number
  listeners?: number
  domNodes?: number
}

function soakScenario(scenario: string, rates: SoakRates, settleMinute?: number): SqrlScenario {
  return {
    scenario,
    kind: 'interaction',
    mode: 'soak',
    soak: {
      settleMinute,
      samples: Array.from({length: 11}, (_, minute) => ({
        minute,
        heapMb: 30 + rates.heapMb * minute,
        listeners: 3000 + (rates.listeners ?? 0) * minute,
        domNodes: 8000 + (rates.domNodes ?? 0) * minute,
      })),
    },
  }
}

function extracted(key: string, scenarios: SqrlScenario[]): number | undefined {
  const run: SqrlRun = {
    _id: 'bench-run-soak',
    startedAt: '2026-10-16T05:00:00Z',
    git: {sha: 'soak'},
    scenarios,
  }
  return SQRL_INPUTS.find((input) => input.key === key)?.extract(run)?.[0]?.value
}

function epsilonOf(key: string): number {
  const run: SqrlRun = {
    _id: 'bench-run-flat',
    startedAt: '2026-10-16T05:00:00Z',
    git: {sha: 'flat'},
    scenarios: [soakScenario('article', {heapMb: 0}), soakScenario('singleString', {heapMb: 0})],
  }
  return SQRL_INPUTS.find((input) => input.key === key)?.extract(run)?.[0]?.epsilon ?? Number.NaN
}

const singleStringSoak = soakScenario('singleString', {heapMb: 0.5, listeners: 7, domNodes: 9})
const articleSoak = soakScenario('article', {heapMb: 4, listeners: 20, domNodes: 60})

describe('soak growth', () => {
  it.each([
    ['singleString first', [singleStringSoak, articleSoak]],
    ['article first', [articleSoak, singleStringSoak]],
  ])('maps each input to its own soak with %s', (_, scenarios) => {
    expect(extracted('soakHeapGrowth', scenarios)).toBeCloseTo(0.5, 12)
    expect(extracted('articleSoakHeapGrowth', scenarios)).toBeCloseTo(4, 12)
    expect(extracted('articleSoakListenerGrowth', scenarios)).toBeCloseTo(20, 12)
    expect(extracted('articleSoakDomGrowth', scenarios)).toBeCloseTo(60, 12)
  })

  it('is missing when only another scenario was soaked', () => {
    expect(extracted('soakHeapGrowth', [articleSoak])).toBeUndefined()
    ARTICLE_SOAK_KEYS.forEach((key) => {
      expect(extracted(key, [singleStringSoak])).toBeUndefined()
    })
  })

  it('fits the article soak from its declared settle minute', () => {
    const rampBeforeSettle: SqrlScenario = {
      ...articleSoak,
      soak: {
        settleMinute: 4,
        samples: (articleSoak.soak?.samples ?? []).map((sample) => ({
          ...sample,
          listeners: sample.minute < 4 ? 1000 : 3000,
        })),
      },
    }
    expect(extracted('articleSoakListenerGrowth', [rampBeforeSettle])).toBe(0)
    expect(
      extracted('articleSoakListenerGrowth', [
        {...rampBeforeSettle, soak: {...rampBeforeSettle.soak, settleMinute: null}},
      ]),
    ).toBeGreaterThan(0)
  })

  it('floors a shrinking soak at 0 before adding k', () => {
    const shrinking = soakScenario('article', {heapMb: -2, listeners: -5, domNodes: -30})
    ARTICLE_SOAK_KEYS.forEach((key) => {
      expect(extracted(key, [shrinking])).toBe(0)
    })
    expect(epsilonOf('articleSoakHeapGrowth')).toBeCloseTo(0.9053638951766163, 12)
    expect(epsilonOf('articleSoakListenerGrowth')).toBe(3.103)
    expect(epsilonOf('articleSoakDomGrowth')).toBe(8.077)
  })
})

const latestRun = runs.at(-1) as SqrlRun

function laterCommit(index: number, extraScenarios: SqrlScenario[] = []): SqrlRun {
  const committedAt = new Date(Date.UTC(2026, 9, 16, index)).toISOString()
  return {
    ...latestRun,
    _id: `bench-run-later-${index}`,
    startedAt: committedAt,
    git: {sha: `later-${index}`, committedAt},
    scenarios: [...(latestRun.scenarios ?? []), ...extraScenarios],
  }
}

/** Main history, then copies of its latest run so every rolling median is flat, then the given article soaks one commit each. */
function withArticleSoaks(soaks: (SqrlScenario | null)[]): SqrlScoreDocument[] {
  const flat = Array.from({length: 7}, (_, index) => laterCommit(index))
  const later = soaks.map((soak, index) => laterCommit(flat.length + index, soak ? [soak] : []))
  return computeSqrlScores([...runs, ...flat, ...later], tags, {computedAt: COMPUTED_AT})
}

const healthyArticleSoak = soakScenario('article', {heapMb: 1, listeners: 0, domNodes: 0})
const leakingArticleSoak = soakScenario('article', {heapMb: 1, listeners: 50, domNodes: 0})

describe('article soak inputs', () => {
  it('are absent from every commit in main history, so the golden scores stand', () => {
    const measured = formulaVersion1.filter((document) =>
      ARTICLE_SOAK_KEYS.some((key) => inputOf(document, key)),
    )
    expect(measured).toEqual([])
  })

  it('enter with zero jump on the first commit that carries an article soak', () => {
    // Later leaking commits pull the reference away from the first value, so a direct entry would jump
    const soaks = [healthyArticleSoak, ...Array.from({length: 4}, () => leakingArticleSoak)]
    const withSoak = withArticleSoaks(soaks)
    const withoutSoak = withArticleSoaks(soaks.map(() => null))
    const first = withSoak.length - soaks.length
    ARTICLE_SOAK_KEYS.forEach((key) => {
      expect(inputOf(withSoak[first - 1], key)).toBeUndefined()
      expect(inputOf(withSoak[first], key)).toBeDefined()
    })
    expect(inputOf(withSoak[first], 'articleSoakListenerGrowth')?.ratio).toBeGreaterThan(10)
    expect(withSoak[first].score).toBeCloseTo(withoutSoak[first].score, 9)
    expect(withSoak[first].scoreCommit).toBeCloseTo(withoutSoak[first].scoreCommit, 9)
    expect(withSoak[first].scoreRaw).toBeCloseTo(withoutSoak[first].scoreRaw, 9)
    expect(withSoak.slice(0, first).map((document) => document.score)).toEqual(
      withoutSoak.slice(0, first).map((document) => document.score),
    )
  })

  it('lowers the score once the article soak leaks listeners', () => {
    const steady = withArticleSoaks(Array.from({length: 11}, () => healthyArticleSoak))
    const leaked = withArticleSoaks([
      ...Array.from({length: 7}, () => healthyArticleSoak),
      ...Array.from({length: 4}, () => leakingArticleSoak),
    ])
    expect(leaked.at(-1)?.score).toBeLessThan(steady.at(-1)?.score ?? 0)
    expect(leaked.at(-1)?.scoreCommit).toBeLessThan(steady.at(-1)?.scoreCommit ?? 0)
    expect(inputOf(leaked.at(-1), 'articleSoakListenerGrowth')?.contributionPoints).toBeLessThan(0)
    expect(leaked.slice(0, -4).map((document) => document.score)).toEqual(
      steady.slice(0, -4).map((document) => document.score),
    )
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
