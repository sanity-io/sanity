/** Data layer for the Engine confidence tab. Ratios are multiplied by 100 to use the dashboard's `percent` unit. */
import {
  CATALOGUE_SUITE_IDS,
  type CatalogueEntryResult,
  type CatalogueSuiteId,
  type CatalogueSuiteResult,
  type CatalogueSuiteStatus,
  ENGINE_CONFIDENCE_RUN_TYPE,
  type EngineConfidenceHeadline,
  type EngineConfidenceMeasureId,
  type EngineConfidenceRunDocument,
  isEntryCaught,
  isoWeekStart,
  missedMutants,
  type MutantCounts,
  type MutatedFileResult,
  mutationScoreOf,
  type StrykerTargetRun,
} from '@repo/utils/engine-confidence'

import {type DriftWindows, type SeriesBreak, type TrendPoint, type TrendSeries} from './data'

export const ENGINE_CONFIDENCE_EXPLAINER =
  'The share of engine bugs the tests catch. Stryker plants small bugs in the document sync ' +
  'engine files (generated bugs caught), a catalogue of realistic engine bugs is replayed ' +
  'against the test suites (known bugs caught), and sync scenarios verified is not measured yet. ' +
  'The headline is the geometric mean of the measures that ran, so a weak measure pulls it down. ' +
  'It cannot reach 100% because some planted bugs change no behaviour. The measures behind the ' +
  'latest week are listed under the headline. A change to the pinned measurement config bumps ' +
  'its version and breaks the series: scores either side of the dashed rule are not comparable.'

export const ENGINE_CONFIDENCE_QUERY = `*[_type == "${ENGINE_CONFIDENCE_RUN_TYPE}"] | order(startedAt asc) {
  _id,
  isoWeek,
  startedAt,
  trigger,
  git{sha, branch, committedAt},
  runner{runId, runAttempt, cpuModel, imageOs},
  config{version},
  headline{ratio, measuresUsed},
  measures{
    generatedBugsCaught{status, reason, ratio, counts, targets[]{target, mode, reusedMutants}},
    knownBugsCaught{status, reason, ratio, activeEntries, caughtEntries},
    syncScenariosVerified{status, reason}
  }
}`

export const ENGINE_CONFIDENCE_DETAIL_QUERY = `*[_type == "${ENGINE_CONFIDENCE_RUN_TYPE}"] | order(startedAt desc)[0] {
  isoWeek,
  startedAt,
  "files": measures.generatedBugsCaught.files[]{path, target, counts},
  "entries": measures.knownBugsCaught.entries[]{
    id, title, severity, failureClass, sourceUrl, addedOn,
    results[]{_key, suite, status}
  }
}`

export const ENGINE_CONFIDENCE_TAG = 'metrics.engine-confidence'
export const ENGINE_CONFIDENCE_DETAIL_TAG = 'metrics.engine-confidence.detail'

export interface EngineMeasureSummary {
  status: 'measured' | 'not-measured'
  reason?: string | null
  ratio?: number | null
}

export interface EngineConfidenceRunSummary {
  _id: string
  isoWeek: string
  startedAt: string
  trigger?: 'schedule' | 'dispatch' | 'local' | null
  git: {sha: string; branch: string; committedAt?: string | null} | null
  runner: {
    runId?: string | null
    runAttempt?: number | null
    cpuModel?: string | null
    imageOs?: string | null
  } | null
  config: {version: number}
  headline: EngineConfidenceHeadline
  measures: {
    generatedBugsCaught: EngineMeasureSummary & {
      counts?: MutantCounts | null
      targets?: Pick<StrykerTargetRun, 'target' | 'mode' | 'reusedMutants'>[] | null
    }
    knownBugsCaught: EngineMeasureSummary & {
      activeEntries?: number | null
      caughtEntries?: number | null
    }
    syncScenariosVerified: EngineMeasureSummary
  }
}

export type EngineDetailFile = Pick<MutatedFileResult, 'path' | 'target' | 'counts'>

export type EngineDetailEntry = Pick<
  CatalogueEntryResult,
  'id' | 'title' | 'severity' | 'failureClass' | 'addedOn'
> & {
  sourceUrl?: string | null
  results: Pick<CatalogueSuiteResult, '_key' | 'suite' | 'status'>[]
}

/** The newest run's drill-down fields; either list is null when its measure was not measured. */
export interface EngineConfidenceDetail {
  isoWeek: string
  startedAt: string
  files: EngineDetailFile[] | null
  entries: EngineDetailEntry[] | null
}

/** Mutation scores barely move between weeks, so two weeks against four is enough to see a step. */
export const ENGINE_DRIFT_WINDOWS: DriftWindows = {
  recentRuns: 2,
  baselineRuns: 4,
  minimumRuns: 4,
}

export const ENGINE_HEADLINE_KEY = 'engine:headline'

/** Engine cards mount from their own query, so a deep link to one waits for that query. */
export function deepLinkTargetLoaded(options: {
  seriesKey: string
  benchSeriesLoaded: boolean
  engineRunsLoaded: boolean
}): boolean {
  return options.seriesKey.startsWith('engine:')
    ? options.engineRunsLoaded
    : options.benchSeriesLoaded
}

const ENGINE_MEASURE_SERIES: {
  key: string
  measure: EngineConfidenceMeasureId | 'headline'
  title: string
  description: string
}[] = [
  {
    key: ENGINE_HEADLINE_KEY,
    measure: 'headline',
    title: 'Engine confidence',
    description: ENGINE_CONFIDENCE_EXPLAINER,
  },
  {
    key: 'engine:generatedBugsCaught',
    measure: 'generatedBugsCaught',
    title: 'Generated bugs caught',
    description:
      'Stryker plants small bugs in the engine files, such as flipping a comparison or deleting a call, and runs the unit tests against each one. This is the share of planted bugs that make a test fail. A test that runs code and asserts nothing leaves the bug uncaught.',
  },
  {
    key: 'engine:knownBugsCaught',
    measure: 'knownBugsCaught',
    title: 'Known bugs caught',
    description:
      'The catalogue holds realistic engine bugs, each a small patch modelled on a real incident or a known gap. This is the share of catalogue bugs that at least one test suite fails on. Every new incident adds an entry, so a drop can mean the catalogue grew.',
  },
  {
    key: 'engine:syncScenariosVerified',
    measure: 'syncScenariosVerified',
    title: 'Sync scenarios verified',
    description:
      'The share of sync scenarios (operation, field type, document state, concurrency, commit outcome) a fuzz run reached and checked. Not measured until the fuzzers report scenario cells.',
  },
]

export function engineMeasureTitle(measureId: EngineConfidenceMeasureId): string {
  return ENGINE_MEASURE_SERIES.find((entry) => entry.measure === measureId)?.title ?? measureId
}

function byStartedAt(left: EngineConfidenceRunSummary, right: EngineConfidenceRunSummary): number {
  return left.startedAt.localeCompare(right.startedAt)
}

export interface ConfigBreak {
  weekStart: Date
  fromVersion: number
  toVersion: number
}

/** Every week whose run measured with a different `config.version` than the run before it. */
export function configBreaks(runs: readonly EngineConfidenceRunSummary[]): ConfigBreak[] {
  const ordered = [...runs].sort(byStartedAt)
  return ordered.flatMap((run, index) => {
    const previous = ordered[index - 1]
    return previous !== undefined && previous.config.version !== run.config.version
      ? [
          {
            weekStart: isoWeekStart(run.isoWeek),
            fromVersion: previous.config.version,
            toVersion: run.config.version,
          },
        ]
      : []
  })
}

function ratioOf(
  run: EngineConfidenceRunSummary,
  measure: EngineConfidenceMeasureId | 'headline',
): number | undefined {
  const ratio =
    measure === 'headline' ? run.headline.ratio : (run.measures[measure].ratio ?? undefined)
  return typeof ratio === 'number' ? ratio : undefined
}

function pointOf(run: EngineConfidenceRunSummary, ratio: number): TrendPoint {
  return {
    date: isoWeekStart(run.isoWeek),
    value: ratio * 100,
    sha: run.git?.sha ?? 'unknown',
    runId: run._id,
    documentType: 'engineConfidenceRun',
    ciRunId: run.runner?.runId ?? undefined,
    ciRunAttempt: run.runner?.runAttempt ?? undefined,
    host: {
      cpuModel: run.runner?.cpuModel ?? undefined,
      imageOs: run.runner?.imageOs ?? undefined,
    },
  }
}

/**
 * The headline and one series per measure, a single `main` line each. A week
 * where a measure was not measured has no point: an honest gap, never a zero.
 */
export function engineConfidenceSeries(runs: readonly EngineConfidenceRunSummary[]): TrendSeries[] {
  const ordered = [...runs].sort(byStartedAt)
  const breaks: SeriesBreak[] = configBreaks(ordered).map((entry) => ({
    date: entry.weekStart,
    label: `config v${entry.toVersion}`,
  }))
  return ENGINE_MEASURE_SERIES.map(({key, measure, title, description}) => ({
    key,
    title,
    unit: 'percent',
    description,
    goal: 'higher',
    group: 'engine',
    drift: ENGINE_DRIFT_WINDOWS,
    breaks,
    lines: [
      {
        branch: 'main',
        points: ordered.flatMap((run) => {
          const ratio = ratioOf(run, measure)
          return ratio === undefined ? [] : [pointOf(run, ratio)]
        }),
      },
    ],
  }))
}

export interface WorstFile {
  path: string
  target: EngineDetailFile['target']
  counts: MutantCounts
  missed: number
  score: number | undefined
}

/** Files with the most planted bugs no test caught, ties broken by the lower score. */
export function worstFiles(
  detail: Pick<EngineConfidenceDetail, 'files'> | null,
  limit = 10,
): WorstFile[] {
  return (detail?.files ?? [])
    .map((file) => ({
      path: file.path,
      target: file.target,
      counts: file.counts,
      missed: missedMutants(file.counts),
      score: mutationScoreOf(file.counts),
    }))
    .sort(
      (left, right) =>
        right.missed - left.missed ||
        (left.score ?? Number.POSITIVE_INFINITY) - (right.score ?? Number.POSITIVE_INFINITY) ||
        left.path.localeCompare(right.path),
    )
    .slice(0, limit)
}

export interface CatalogueGridRow {
  id: string
  title: string
  severity: EngineDetailEntry['severity']
  sourceUrl?: string
  caught: boolean
  cells: {suite: CatalogueSuiteId; status: CatalogueSuiteStatus}[]
}

export interface CatalogueGrid {
  columns: readonly CatalogueSuiteId[]
  rows: CatalogueGridRow[]
}

/** Entries by suites, one cell per suite in `CATALOGUE_SUITE_IDS` order; a suite with no result reads `not-run`. */
export function catalogueGrid(
  detail: Pick<EngineConfidenceDetail, 'entries'> | null,
): CatalogueGrid {
  const rows = [...(detail?.entries ?? [])]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      severity: entry.severity,
      ...(entry.sourceUrl ? {sourceUrl: entry.sourceUrl} : {}),
      caught: isEntryCaught(entry),
      cells: CATALOGUE_SUITE_IDS.map((suite) => ({
        suite,
        status: entry.results.find((result) => result.suite === suite)?.status ?? 'not-run',
      })),
    }))
  return {columns: CATALOGUE_SUITE_IDS, rows}
}

export function filterEngineRunsByRange(
  runs: readonly EngineConfidenceRunSummary[],
  days: number | null,
  now = Date.now(),
): EngineConfidenceRunSummary[] {
  if (days === null) return [...runs]
  const cutoff = now - days * 24 * 60 * 60 * 1000
  return runs.filter((run) => new Date(run.startedAt).getTime() >= cutoff)
}

/** What `ENGINE_CONFIDENCE_DETAIL_QUERY` returns, derived from a full document (demo and local data). */
export function engineConfidenceDetailOf(
  run: Pick<EngineConfidenceRunDocument, 'isoWeek' | 'startedAt' | 'measures'>,
): EngineConfidenceDetail {
  const {generatedBugsCaught, knownBugsCaught} = run.measures
  return {
    isoWeek: run.isoWeek,
    startedAt: run.startedAt,
    files: generatedBugsCaught.status === 'measured' ? generatedBugsCaught.files : null,
    entries: knownBugsCaught.status === 'measured' ? knownBugsCaught.entries : null,
  }
}
