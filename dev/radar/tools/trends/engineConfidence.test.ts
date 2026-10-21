import {
  addMutantCounts,
  emptyMutantCounts,
  isoWeekOf,
  isoWeekStart,
  mutationScoreOf,
  targetScoreOf,
} from '@repo/utils/engine-confidence'
import {engineConfidenceRunId} from '@repo/utils/radar-ids'
import {describe, expect, test} from 'vitest'

import {generateDebugEngineConfidenceRuns} from './debugData'
import {
  catalogueGrid,
  configBreaks,
  deepLinkTargetLoaded,
  ENGINE_CONFIDENCE_EXPLAINER,
  ENGINE_SCORE_KEY,
  ENGINE_STUDIO_SCORE_KEY,
  engineConfidenceDetailOf,
  engineConfidenceSeries,
  type EngineConfidenceDetail,
  type EngineConfidenceRunSummary,
  type EngineScoreSummary,
  type EngineStudioScoreSummary,
  filterEngineRunsByRange,
  worstFiles,
} from './engineConfidence'
import {weeklyBuckets} from './weekly'

const FIRST_MONDAY = Date.UTC(2026, 0, 5)
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function measured(ratio: number): EngineScoreSummary {
  return {status: 'measured', ratio}
}

const NOT_MEASURED: EngineScoreSummary = {status: 'not-measured', reason: 'no stryker report yet'}

function summaryRun(
  weekIndex: number,
  options: {
    score?: number
    studioScore?: number
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
    score: options.score === undefined ? NOT_MEASURED : measured(options.score),
    ...(options.studioScore === undefined
      ? {}
      : {studioScore: measured(options.studioScore) satisfies EngineStudioScoreSummary}),
    knownBugs: {status: 'not-measured', reason: 'no catalogue results'},
  }
}

function seriesByKey(series: ReturnType<typeof engineConfidenceSeries>, key: string) {
  const found = series.find((entry) => entry.key === key)
  if (found === undefined) throw new Error(`missing series ${key}`)
  return found
}

describe('engineConfidenceSeries', () => {
  const runs = [summaryRun(0, {score: 0.7}), summaryRun(1, {score: 0.72})]

  test('builds the total and core Studio score series in the engine group', () => {
    const series = engineConfidenceSeries(runs)
    expect(series.map((entry) => entry.key)).toEqual([ENGINE_SCORE_KEY, ENGINE_STUDIO_SCORE_KEY])
    expect(series.map((entry) => entry.title)).toEqual([
      'Total engine confidence',
      'Core Studio engine confidence',
    ])
    expect(series.every((entry) => entry.group === 'engine')).toBe(true)
    expect(series.every((entry) => entry.unit === 'percent' && entry.goal === 'higher')).toBe(true)
    expect(
      series.every((entry) => entry.lines.length === 1 && entry.lines[0].branch === 'main'),
    ).toBe(true)
  })

  test('converts ratios to percent and dates each point to its ISO week start', () => {
    const score = seriesByKey(engineConfidenceSeries(runs), ENGINE_SCORE_KEY)
    const [first, second] = score.lines[0].points
    expect(first.value).toBeCloseTo(70)
    expect(second.value).toBeCloseTo(72)
    expect(first.date).toEqual(isoWeekStart(runs[0].isoWeek))
    expect(first.date.getUTCDay()).toBe(1)
    expect(first.documentType).toBe('engineConfidenceRun')
    expect(first.runId).toBe(runs[0]._id)
  })

  test('puts each week in exactly one weekly bucket', () => {
    const score = seriesByKey(engineConfidenceSeries(runs), ENGINE_SCORE_KEY)
    const buckets = weeklyBuckets(score.lines[0].points)
    expect(buckets.map((bucket) => bucket.runs)).toEqual([1, 1])
  })

  test('leaves a gap for a week where the score was not measured', () => {
    const withGap = [summaryRun(0, {score: 0.7}), summaryRun(1), summaryRun(2, {score: 0.72})]
    const series = engineConfidenceSeries(withGap)
    expect(seriesByKey(series, ENGINE_SCORE_KEY).lines[0].points).toHaveLength(2)
  })

  test('reads the Studio series from studioScore and leaves a gap for a run without it', () => {
    const mixed = [
      summaryRun(0, {score: 0.7}),
      summaryRun(1, {score: 0.72, studioScore: 0.8}),
      summaryRun(2, {score: 0.73, studioScore: 0.82}),
    ]
    const series = engineConfidenceSeries(mixed)
    const studio = seriesByKey(series, ENGINE_STUDIO_SCORE_KEY)

    expect(studio.lines[0].points.map((point) => point.runId)).toEqual([mixed[1]._id, mixed[2]._id])
    expect(studio.lines[0].points[0].value).toBeCloseTo(80)
    expect(seriesByKey(series, ENGINE_SCORE_KEY).lines[0].points).toHaveLength(3)
  })

  test('orders points oldest first regardless of input order', () => {
    const score = seriesByKey(engineConfidenceSeries([...runs].reverse()), ENGINE_SCORE_KEY)
    expect(score.lines[0].points.map((point) => point.runId)).toEqual(runs.map((run) => run._id))
  })

  test('uses weekly drift windows and carries the config breaks', () => {
    const series = engineConfidenceSeries([
      summaryRun(0, {score: 0.7, configVersion: 1}),
      summaryRun(1, {score: 0.7, configVersion: 2}),
    ])
    const expectedBreaks = [{date: isoWeekStart(summaryRun(1).isoWeek), label: 'config v2'}]
    series.forEach((entry) => {
      expect(entry.drift).toEqual({recentRuns: 2, baselineRuns: 4, minimumRuns: 4})
      expect(entry.breaks).toEqual(expectedBreaks)
    })
  })

  test('the explainer names the series break and keeps known bugs out of the score', () => {
    expect(ENGINE_CONFIDENCE_EXPLAINER).toContain('breaks the series')
    expect(ENGINE_CONFIDENCE_EXPLAINER).toContain('does not feed the score')
    expect(ENGINE_CONFIDENCE_EXPLAINER).toContain('@sanity/mutator')
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

  test('is valid stored documents: ids follow the week', () => {
    for (const run of demo) {
      expect(run._type).toBe('engineConfidenceRun')
      expect(run.schemaVersion).toBe(2)
      expect(run._id).toBe(engineConfidenceRunId(run.isoWeek))
      expect(run.isoWeek).toBe(isoWeekOf(new Date(run.startedAt)))
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
      const {score} = run
      if (score.status !== 'measured') throw new Error('expected measured')
      return score.ratio
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
    const {score} = demo.at(-1)!
    if (score.status !== 'measured') throw new Error('expected measured')
    const total = score.files.reduce(
      (sum, file) => sum + file.counts.killed + file.counts.survived + file.counts.noCoverage,
      0,
    )
    expect(total).toBe(score.counts.killed + score.counts.survived + score.counts.noCoverage)
    expect(score.ratio).toBe(mutationScoreOf(score.counts))
    expect(score.files.every((file, index) => file._key === `file-${index}`)).toBe(true)
    expect(score.targets.map((target) => target._key)).toEqual(['target-0', 'target-1'])
  })

  test('derives the core Studio score from the sanity files only', () => {
    const {score, studioScore} = demo.at(-1)!
    if (score.status !== 'measured' || studioScore.status !== 'measured') {
      throw new Error('expected measured')
    }
    const studioCounts = score.files
      .filter((file) => file.target === 'sanity')
      .reduce((sum, file) => addMutantCounts(sum, file.counts), emptyMutantCounts())

    expect(studioScore.counts).toEqual(studioCounts)
    expect(studioScore.ratio).toBe(mutationScoreOf(studioCounts))
    expect(studioScore).toEqual(targetScoreOf(score.files, 'sanity'))
    expect(studioScore.ratio).not.toBe(score.ratio)
  })

  test('reports ignored and excluded mutants outside the ratio, summing to the totals', () => {
    const {score} = demo.at(-1)!
    if (score.status !== 'measured') throw new Error('expected measured')
    const sumOf = (field: 'ignored' | 'excluded') =>
      score.files.reduce((sum, file) => sum + file.counts[field], 0)

    expect(score.counts.excluded).toBeGreaterThan(0)
    expect(score.counts.ignored).toBeGreaterThan(0)
    expect(sumOf('excluded')).toBe(score.counts.excluded)
    expect(sumOf('ignored')).toBe(score.counts.ignored)
    expect(mutationScoreOf({...score.counts, excluded: 0, ignored: 0})).toBe(score.ratio)
  })

  test('grows the catalogue from 5 to 7 entries and starts catching one, without it feeding the score', () => {
    const entryCount = (run: (typeof demo)[number]) => {
      const {knownBugs} = run
      if (knownBugs.status !== 'measured') throw new Error('expected measured')
      return {
        active: knownBugs.activeEntries,
        caught: knownBugs.caughtEntries,
        entries: knownBugs.entries,
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
    expect(demo[0].knownBugs).not.toHaveProperty('ratio')
  })

  test('runs full every fourth week and incremental in between', () => {
    const modes = demo.map((run) => {
      const {score} = run
      if (score.status !== 'measured') throw new Error('expected measured')
      return score.targets.map((target) => target.mode)
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
    expect(seriesByKey(series, ENGINE_SCORE_KEY).lines[0].points).toHaveLength(20)
    expect(seriesByKey(series, ENGINE_STUDIO_SCORE_KEY).lines[0].points).toHaveLength(20)
    const detail = engineConfidenceDetailOf(demo.at(-1)!)
    expect(detail.isoWeek).toBe(demo.at(-1)!.isoWeek)
    expect(worstFiles(detail)[0].path).toContain('@sanity/mutator/src/document/')
    expect(catalogueGrid(detail).rows).toHaveLength(7)
  })
})

describe('engineConfidenceDetailOf', () => {
  test('has no drill-down lists when the score and known bugs were not measured', () => {
    const run = {
      isoWeek: '2026-W42',
      startedAt: '2026-10-15T03:00:00.000Z',
      score: {status: 'not-measured' as const, reason: 'no reports'},
      knownBugs: {status: 'not-measured' as const, reason: 'no results'},
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
    expect(deepLinkTargetLoaded({seriesKey: ENGINE_SCORE_KEY, ...benchOnly})).toBe(false)
    expect(
      deepLinkTargetLoaded({seriesKey: ENGINE_SCORE_KEY, ...benchOnly, engineRunsLoaded: true}),
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
