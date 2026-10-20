import {
  emptyMutantCounts,
  headlineOf,
  isoWeekOf,
  isoWeekStart,
  mutationScoreOf,
} from '@repo/utils/engine-confidence'
import {engineConfidenceRunId} from '@repo/utils/radar-ids'
import {describe, expect, test} from 'vitest'

import {generateDebugEngineConfidenceRuns} from './debugData'
import {
  catalogueGrid,
  configBreaks,
  deepLinkTargetLoaded,
  ENGINE_CONFIDENCE_EXPLAINER,
  engineConfidenceDetailOf,
  engineConfidenceSeries,
  type EngineConfidenceDetail,
  type EngineConfidenceRunSummary,
  type EngineMeasureSummary,
  filterEngineRunsByRange,
  worstFiles,
} from './engineConfidence'
import {weeklyBuckets} from './weekly'

const FIRST_MONDAY = Date.UTC(2026, 0, 5)
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function measured(ratio: number): EngineMeasureSummary {
  return {status: 'measured', ratio}
}

const NOT_MEASURED: EngineMeasureSummary = {status: 'not-measured', reason: 'no fuzzer yet'}

function summaryRun(
  weekIndex: number,
  options: {
    generated?: number
    known?: number
    headline?: number
    configVersion?: number
  } = {},
): EngineConfidenceRunSummary {
  const startedAt = new Date(FIRST_MONDAY + weekIndex * WEEK_MS + 3 * 24 * 60 * 60 * 1000)
  const isoWeek = isoWeekOf(startedAt)
  return {
    _id: engineConfidenceRunId(isoWeek),
    isoWeek,
    startedAt: startedAt.toISOString(),
    trigger: 'schedule',
    git: {sha: `sha${weekIndex}`, branch: 'main'},
    runner: {runId: `run${weekIndex}`, runAttempt: 1},
    config: {version: options.configVersion ?? 1},
    headline: {
      ...(options.headline === undefined ? {} : {ratio: options.headline}),
      measuresUsed: [],
    },
    measures: {
      generatedBugsCaught:
        options.generated === undefined ? NOT_MEASURED : measured(options.generated),
      knownBugsCaught: options.known === undefined ? NOT_MEASURED : measured(options.known),
      syncScenariosVerified: NOT_MEASURED,
    },
  }
}

function seriesByKey(series: ReturnType<typeof engineConfidenceSeries>, key: string) {
  const found = series.find((entry) => entry.key === key)
  if (found === undefined) throw new Error(`missing series ${key}`)
  return found
}

describe('engineConfidenceSeries', () => {
  const runs = [
    summaryRun(0, {generated: 0.7, known: 0.8, headline: 0.748}),
    summaryRun(1, {generated: 0.72, known: 0.8, headline: 0.758}),
  ]

  test('builds the headline and one series per measure in the engine group', () => {
    const series = engineConfidenceSeries(runs)
    expect(series.map((entry) => entry.key)).toEqual([
      'engine:headline',
      'engine:generatedBugsCaught',
      'engine:knownBugsCaught',
      'engine:syncScenariosVerified',
    ])
    expect(series.every((entry) => entry.group === 'engine')).toBe(true)
    expect(series.every((entry) => entry.unit === 'percent' && entry.goal === 'higher')).toBe(true)
    expect(
      series.every((entry) => entry.lines.length === 1 && entry.lines[0].branch === 'main'),
    ).toBe(true)
  })

  test('converts ratios to percent and dates each point to its ISO week start', () => {
    const generated = seriesByKey(engineConfidenceSeries(runs), 'engine:generatedBugsCaught')
    const [first, second] = generated.lines[0].points
    expect(first.value).toBeCloseTo(70)
    expect(second.value).toBeCloseTo(72)
    expect(first.date).toEqual(isoWeekStart(runs[0].isoWeek))
    expect(first.date.getUTCDay()).toBe(1)
    expect(first.documentType).toBe('engineConfidenceRun')
    expect(first.runId).toBe(runs[0]._id)
  })

  test('puts each week in exactly one weekly bucket', () => {
    const headline = seriesByKey(engineConfidenceSeries(runs), 'engine:headline')
    const buckets = weeklyBuckets(headline.lines[0].points)
    expect(buckets.map((bucket) => bucket.runs)).toEqual([1, 1])
  })

  test('leaves a gap for a week where a measure was not measured', () => {
    const withGap = [
      summaryRun(0, {generated: 0.7, known: 0.8, headline: 0.748}),
      summaryRun(1, {generated: 0.71, headline: 0.71}),
      summaryRun(2, {generated: 0.72, known: 0.8, headline: 0.758}),
    ]
    const series = engineConfidenceSeries(withGap)
    expect(seriesByKey(series, 'engine:knownBugsCaught').lines[0].points).toHaveLength(2)
    expect(seriesByKey(series, 'engine:generatedBugsCaught').lines[0].points).toHaveLength(3)
    expect(seriesByKey(series, 'engine:syncScenariosVerified').lines[0].points).toHaveLength(0)
  })

  test('orders points oldest first regardless of input order', () => {
    const generated = seriesByKey(
      engineConfidenceSeries([...runs].reverse()),
      'engine:generatedBugsCaught',
    )
    expect(generated.lines[0].points.map((point) => point.runId)).toEqual(
      runs.map((run) => run._id),
    )
  })

  test('uses weekly drift windows and carries the config breaks', () => {
    const series = engineConfidenceSeries([
      summaryRun(0, {generated: 0.7, configVersion: 1}),
      summaryRun(1, {generated: 0.7, configVersion: 2}),
    ])
    const headline = seriesByKey(series, 'engine:headline')
    expect(headline.drift).toEqual({recentRuns: 2, baselineRuns: 4, minimumRuns: 4})
    expect(headline.breaks).toEqual([
      {date: isoWeekStart(summaryRun(1).isoWeek), label: 'config v2'},
    ])
  })

  test('the explainer names the headline formula and the series break', () => {
    expect(ENGINE_CONFIDENCE_EXPLAINER).toContain('geometric mean')
    expect(ENGINE_CONFIDENCE_EXPLAINER).toContain('breaks the series')
  })
})

describe('configBreaks', () => {
  test('reports each week whose config version differs from the run before', () => {
    const breaks = configBreaks([
      summaryRun(0, {configVersion: 1}),
      summaryRun(1, {configVersion: 1}),
      summaryRun(2, {configVersion: 2}),
      summaryRun(3, {configVersion: 2}),
      summaryRun(4, {configVersion: 3}),
    ])
    expect(breaks).toEqual([
      {weekStart: isoWeekStart(summaryRun(2).isoWeek), fromVersion: 1, toVersion: 2},
      {weekStart: isoWeekStart(summaryRun(4).isoWeek), fromVersion: 2, toVersion: 3},
    ])
  })

  test('reports nothing for a single version or a single run', () => {
    expect(configBreaks([summaryRun(0), summaryRun(1)])).toEqual([])
    expect(configBreaks([summaryRun(0)])).toEqual([])
    expect(configBreaks([])).toEqual([])
  })
})

function counts(killed: number, survived: number, noCoverage: number) {
  return {...emptyMutantCounts(), killed, survived, noCoverage}
}

describe('worstFiles', () => {
  test('carries ignored and excluded counts and keeps them out of missed and the score', () => {
    const [file] = worstFiles({
      files: [
        {
          path: 'a.ts',
          target: 'sanity',
          counts: {...counts(6, 2, 0), ignored: 9, excluded: 5},
        },
      ],
    })

    expect(file.counts).toMatchObject({ignored: 9, excluded: 5})
    expect(file.missed).toBe(2)
    expect(file.score).toBeCloseTo(0.75)
  })

  const detail: Pick<EngineConfidenceDetail, 'files'> = {
    files: [
      {path: 'a.ts', target: 'sanity', counts: counts(10, 1, 0)},
      {path: 'b.ts', target: 'mutator', counts: counts(5, 4, 3)},
      {path: 'c.ts', target: 'sanity', counts: counts(2, 6, 2)},
      {path: 'd.ts', target: 'sanity', counts: counts(40, 7, 0)},
      {path: 'e.ts', target: 'sanity', counts: emptyMutantCounts()},
    ],
  }

  test('sorts by missed mutants descending, counting survived and no coverage', () => {
    expect(worstFiles(detail).map((file) => file.path)).toEqual([
      'c.ts',
      'b.ts',
      'd.ts',
      'a.ts',
      'e.ts',
    ])
    expect(worstFiles(detail)[0]).toMatchObject({missed: 8})
  })

  test('breaks ties by the lower mutation score, then by path', () => {
    const tied = worstFiles({
      files: [
        {path: 'z.ts', target: 'sanity', counts: counts(30, 5, 0)},
        {path: 'y.ts', target: 'sanity', counts: counts(5, 5, 0)},
        {path: 'x.ts', target: 'sanity', counts: counts(5, 5, 0)},
      ],
    })
    expect(tied.map((file) => file.path)).toEqual(['x.ts', 'y.ts', 'z.ts'])
    expect(tied[0].score).toBeCloseTo(0.5)
  })

  test('respects the limit and survives a measure with no files', () => {
    expect(worstFiles(detail, 2)).toHaveLength(2)
    expect(worstFiles({files: null})).toEqual([])
    expect(worstFiles(null)).toEqual([])
  })

  test('a file with nothing scored has an undefined score', () => {
    expect(worstFiles(detail).find((file) => file.path === 'e.ts')?.score).toBeUndefined()
    expect(mutationScoreOf(emptyMutantCounts())).toBeUndefined()
  })
})

describe('catalogueGrid', () => {
  const detail: Pick<EngineConfidenceDetail, 'entries'> = {
    entries: [
      {
        id: 'ENG-002',
        title: 'Second',
        severity: 'S1',
        failureClass: 'x',
        addedOn: '2026-10-01',
        sourceUrl: 'https://example.com/2',
        results: [
          {_key: 'suite-0', suite: 'fuzz:pt', status: 'missed'},
          {_key: 'suite-1', suite: 'unit:engine', status: 'caught'},
        ],
      },
      {
        id: 'ENG-001',
        title: 'First',
        severity: 'S2',
        failureClass: 'y',
        addedOn: '2026-10-01',
        results: [
          {_key: 'suite-0', suite: 'unit:mutator', status: 'missed'},
          {_key: 'suite-1', suite: 'unit:engine', status: 'missed'},
        ],
      },
    ],
  }

  test('lays columns out in suite order and fills a missing suite with not-run', () => {
    const grid = catalogueGrid(detail)
    expect(grid.columns).toEqual(['unit:mutator', 'unit:engine', 'fuzz:pt', 'e2e'])
    const [first, second] = grid.rows
    expect(first.id).toBe('ENG-001')
    expect(first.cells.map((cell) => cell.suite)).toEqual(grid.columns)
    expect(first.cells.map((cell) => cell.status)).toEqual([
      'missed',
      'missed',
      'not-run',
      'not-run',
    ])
    expect(second.cells.map((cell) => cell.status)).toEqual([
      'not-run',
      'caught',
      'missed',
      'not-run',
    ])
  })

  test('marks an entry caught when any suite catches it', () => {
    const [first, second] = catalogueGrid(detail).rows
    expect(first.caught).toBe(false)
    expect(second.caught).toBe(true)
    expect(second.sourceUrl).toBe('https://example.com/2')
    expect(first).not.toHaveProperty('sourceUrl')
  })

  test('is empty without entries', () => {
    expect(catalogueGrid({entries: null}).rows).toEqual([])
    expect(catalogueGrid(null).rows).toEqual([])
  })
})

describe('filterEngineRunsByRange', () => {
  test('keeps runs started inside the window and everything for all time', () => {
    const runs = [summaryRun(0), summaryRun(1), summaryRun(2)]
    const now = new Date(runs[2].startedAt).getTime() + 60 * 60 * 1000
    expect(filterEngineRunsByRange(runs, 5, now)).toEqual([runs[2]])
    expect(filterEngineRunsByRange(runs, 30, now)).toHaveLength(3)
    expect(filterEngineRunsByRange(runs, null, now)).toHaveLength(3)
  })
})

describe('generateDebugEngineConfidenceRuns', () => {
  const now = new Date(Date.UTC(2026, 9, 16, 12))
  const demo = generateDebugEngineConfidenceRuns('demo', now)

  test('returns 20 consecutive weeks ending in the newest run that has happened', () => {
    expect(demo).toHaveLength(20)
    const weekStarts = demo.map((run) => isoWeekStart(run.isoWeek).getTime())
    weekStarts.slice(1).forEach((weekStart, index) => {
      expect(weekStart - weekStarts[index]).toBe(WEEK_MS)
    })
    expect(demo.at(-1)?.isoWeek).toBe('2026-W42')
    expect(new Date(demo.at(-1)!.startedAt).getTime()).toBeLessThanOrEqual(now.getTime())
  })

  test('steps back a week before the current week has had its Thursday run', () => {
    const monday = generateDebugEngineConfidenceRuns('demo', new Date(Date.UTC(2026, 9, 12, 9)))
    expect(monday.at(-1)?.isoWeek).toBe('2026-W41')
  })

  test('is valid stored documents: ids follow the week, headline follows the measures', () => {
    for (const run of demo) {
      expect(run._type).toBe('engineConfidenceRun')
      expect(run.schemaVersion).toBe(1)
      expect(run._id).toBe(engineConfidenceRunId(run.isoWeek))
      expect(run.isoWeek).toBe(isoWeekOf(new Date(run.startedAt)))
      expect(run.headline).toEqual(headlineOf(run.measures))
    }
  })

  test('is deterministic', () => {
    expect(generateDebugEngineConfidenceRuns('demo', now)).toEqual(demo)
  })

  test('bumps the config version once, at week 12', () => {
    expect(demo.map((run) => run.config.version)).toEqual([
      ...Array.from({length: 12}, () => 1),
      ...Array.from({length: 8}, () => 2),
    ])
    const [only] = configBreaks(demo)
    expect(configBreaks(demo)).toHaveLength(1)
    expect(only.weekStart).toEqual(isoWeekStart(demo[12].isoWeek))
  })

  test('climbs from about 69% to about 74% with a flat stretch', () => {
    const ratios = demo.map((run) => {
      const measure = run.measures.generatedBugsCaught
      if (measure.status !== 'measured') throw new Error('expected measured')
      return measure.ratio
    })
    expect(ratios[0]).toBeGreaterThan(0.68)
    expect(ratios[0]).toBeLessThan(0.7)
    expect(ratios.at(-1)).toBeGreaterThan(0.725)
    expect(ratios.at(-1)).toBeLessThan(0.75)
    expect(ratios[10]).toBeCloseTo(ratios[7], 6)
    expect(ratios[12]).toBeLessThan(ratios[11])
    expect(ratios[19]).toBeGreaterThan(ratios[0])
  })

  test('keeps the ratio and the per-file counts consistent', () => {
    const measure = demo.at(-1)!.measures.generatedBugsCaught
    if (measure.status !== 'measured') throw new Error('expected measured')
    const total = measure.files.reduce(
      (sum, file) => sum + file.counts.killed + file.counts.survived + file.counts.noCoverage,
      0,
    )
    expect(total).toBe(measure.counts.killed + measure.counts.survived + measure.counts.noCoverage)
    expect(measure.ratio).toBe(mutationScoreOf(measure.counts))
    expect(measure.files.every((file, index) => file._key === `file-${index}`)).toBe(true)
    expect(measure.targets.map((target) => target._key)).toEqual(['target-0', 'target-1'])
  })

  test('reports ignored and excluded mutants outside the ratio, summing to the totals', () => {
    const measure = demo.at(-1)!.measures.generatedBugsCaught
    if (measure.status !== 'measured') throw new Error('expected measured')
    const sumOf = (field: 'ignored' | 'excluded') =>
      measure.files.reduce((sum, file) => sum + file.counts[field], 0)

    expect(measure.counts.excluded).toBeGreaterThan(0)
    expect(measure.counts.ignored).toBeGreaterThan(0)
    expect(sumOf('excluded')).toBe(measure.counts.excluded)
    expect(sumOf('ignored')).toBe(measure.counts.ignored)
    expect(mutationScoreOf({...measure.counts, excluded: 0, ignored: 0})).toBe(measure.ratio)
  })

  test('grows the catalogue from 5 to 7 entries and starts catching one', () => {
    const entryCount = (run: (typeof demo)[number]) => {
      const measure = run.measures.knownBugsCaught
      if (measure.status !== 'measured') throw new Error('expected measured')
      return {
        active: measure.activeEntries,
        caught: measure.caughtEntries,
        entries: measure.entries,
      }
    }
    expect(entryCount(demo[0]).active).toBe(5)
    expect(entryCount(demo.at(-1)!).active).toBe(7)
    expect(entryCount(demo[14]).caught).toBe(5)
    expect(entryCount(demo[15]).caught).toBe(6)
    expect(entryCount(demo[0]).entries.map((entry) => entry._key)).toEqual([
      'entry-0',
      'entry-1',
      'entry-2',
      'entry-3',
      'entry-4',
    ])
  })

  test('never measures sync scenarios', () => {
    expect(demo.every((run) => run.measures.syncScenariosVerified.status === 'not-measured')).toBe(
      true,
    )
    expect(demo.every((run) => !run.headline.measuresUsed.includes('syncScenariosVerified'))).toBe(
      true,
    )
  })

  test('runs full every fourth week and incremental in between', () => {
    const modes = demo.map((run) => {
      const measure = run.measures.generatedBugsCaught
      if (measure.status !== 'measured') throw new Error('expected measured')
      return measure.targets.map((target) => target.mode)
    })
    expect(modes[0]).toEqual(['full', 'full'])
    expect(modes[1]).toEqual(['incremental', 'incremental'])
    expect(modes[4]).toEqual(['full', 'full'])
  })

  test('sparse has four weeks with a gap, single-run one week, empty none', () => {
    const sparse = generateDebugEngineConfidenceRuns('sparse', now)
    expect(sparse).toHaveLength(4)
    const gaps = sparse
      .slice(1)
      .map(
        (run, index) =>
          (isoWeekStart(run.isoWeek).getTime() - isoWeekStart(sparse[index].isoWeek).getTime()) /
          WEEK_MS,
      )
    expect(gaps.some((gap) => gap > 1)).toBe(true)
    expect(generateDebugEngineConfidenceRuns('single-run', now)).toHaveLength(1)
    expect(generateDebugEngineConfidenceRuns('empty', now)).toEqual([])
  })

  test('feeds the series mapper and the detail derivation', () => {
    const series = engineConfidenceSeries(demo)
    expect(seriesByKey(series, 'engine:headline').lines[0].points).toHaveLength(20)
    expect(seriesByKey(series, 'engine:syncScenariosVerified').lines[0].points).toHaveLength(0)
    const detail = engineConfidenceDetailOf(demo.at(-1)!)
    expect(detail.isoWeek).toBe(demo.at(-1)!.isoWeek)
    expect(worstFiles(detail)[0].path).toContain('@sanity/mutator/src/document/')
    expect(catalogueGrid(detail).rows).toHaveLength(7)
  })
})

describe('engineConfidenceDetailOf', () => {
  test('has no drill-down lists when the measures were not measured', () => {
    const run = {
      isoWeek: '2026-W42',
      startedAt: '2026-10-15T03:00:00.000Z',
      measures: {
        generatedBugsCaught: {status: 'not-measured' as const, reason: 'no reports'},
        knownBugsCaught: {status: 'not-measured' as const, reason: 'no results'},
        syncScenariosVerified: {status: 'not-measured' as const, reason: 'v1'},
      },
    }
    expect(engineConfidenceDetailOf(run)).toEqual({
      isoWeek: '2026-W42',
      startedAt: '2026-10-15T03:00:00.000Z',
      files: null,
      entries: null,
    })
  })
})

describe('deepLinkTargetLoaded', () => {
  test('waits for the engine query when the link names an engine card', () => {
    const benchOnly = {benchSeriesLoaded: true, engineRunsLoaded: false}
    expect(deepLinkTargetLoaded({seriesKey: 'engine:headline', ...benchOnly})).toBe(false)
    expect(
      deepLinkTargetLoaded({seriesKey: 'engine:headline', ...benchOnly, engineRunsLoaded: true}),
    ).toBe(true)
  })

  test('waits for the bench series when the link names a bench chart', () => {
    const engineOnly = {benchSeriesLoaded: false, engineRunsLoaded: true}
    expect(deepLinkTargetLoaded({seriesKey: 'bundle:initialJs', ...engineOnly})).toBe(false)
    expect(
      deepLinkTargetLoaded({seriesKey: 'bundle:initialJs', ...engineOnly, benchSeriesLoaded: true}),
    ).toBe(true)
  })
})
