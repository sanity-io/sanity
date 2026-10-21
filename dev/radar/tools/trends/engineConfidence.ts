/** Data layer for the Engine confidence tab. Ratios are multiplied by 100 to use the dashboard's `percent` unit. */
import {
  CATALOGUE_SUITE_IDS,
  type CatalogueEntryResult,
  type CatalogueSuiteId,
  type CatalogueSuiteResult,
  type CatalogueSuiteStatus,
  ENGINE_CONFIDENCE_RUN_TYPE,
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
  'The engine confidence score is the share of planted bugs the tests catch. Stryker plants ' +
  'small bugs in the document sync engine files and runs the test suites against each one; the ' +
  'score is the share a test fails on. It cannot reach 100% because some planted bugs change no ' +
  'behaviour. A known-bug catalogue of realistic engine bugs is also replayed against the test ' +
  'suites and shown below as supporting detail; it does not feed the score. A change to the ' +
  'pinned measurement config bumps its version and breaks the series: scores either side of the ' +
  'dashed rule are not comparable.'

export const ENGINE_CONFIDENCE_QUERY = `*[_type == "${ENGINE_CONFIDENCE_RUN_TYPE}"] | order(startedAt asc) {
  _id,
  isoWeek,
  startedAt,
  trigger,
  git{sha, branch, committedAt},
  runner{runId, runAttempt, cpuModel, imageOs},
  config{version},
  score{status, reason, ratio, counts, targets[]{target, mode, reusedMutants}},
  knownBugs{status, reason, activeEntries, caughtEntries}
}`

export const ENGINE_CONFIDENCE_DETAIL_QUERY = `*[_type == "${ENGINE_CONFIDENCE_RUN_TYPE}"] | order(startedAt desc)[0] {
  isoWeek,
  startedAt,
  "files": score.files[]{path, target, counts},
  "entries": knownBugs.entries[]{
    id, title, severity, failureClass, sourceUrl, addedOn,
    results[]{_key, suite, status}
  }
}`

export const ENGINE_CONFIDENCE_TAG = 'metrics.engine-confidence'
export const ENGINE_CONFIDENCE_DETAIL_TAG = 'metrics.engine-confidence.detail'

interface EngineStatusSummary {
  status: 'measured' | 'not-measured'
  reason?: string | null
}

export interface EngineScoreSummary extends EngineStatusSummary {
  ratio?: number | null
  counts?: MutantCounts | null
  targets?: Pick<StrykerTargetRun, 'target' | 'mode' | 'reusedMutants'>[] | null
}

export interface EngineKnownBugsSummary extends EngineStatusSummary {
  activeEntries?: number | null
  caughtEntries?: number | null
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
  score: EngineScoreSummary
  knownBugs: EngineKnownBugsSummary
}

export type EngineDetailFile = Pick<MutatedFileResult, 'path' | 'target' | 'counts'>

export type EngineDetailEntry = Pick<
  CatalogueEntryResult,
  'id' | 'title' | 'severity' | 'failureClass' | 'addedOn'
> & {
  sourceUrl?: string | null
  results: Pick<CatalogueSuiteResult, '_key' | 'suite' | 'status'>[]
}

/** The newest run's drill-down fields; either list is null when its source was not measured. */
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

export const ENGINE_SCORE_KEY = 'engine:score'

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
 * The engine confidence score as a single series, a single `main` line. A
 * week where the score was not measured has no point: an honest gap, never a
 * zero.
 */
export function engineConfidenceSeries(runs: readonly EngineConfidenceRunSummary[]): TrendSeries[] {
  const ordered = [...runs].sort(byStartedAt)
  const breaks: SeriesBreak[] = configBreaks(ordered).map((entry) => ({
    date: entry.weekStart,
    label: `config v${entry.toVersion}`,
  }))
  return [
    {
      key: ENGINE_SCORE_KEY,
      title: 'Engine confidence',
      unit: 'percent',
      description: ENGINE_CONFIDENCE_EXPLAINER,
      goal: 'higher',
      group: 'engine',
      drift: ENGINE_DRIFT_WINDOWS,
      breaks,
      lines: [
        {
          branch: 'main',
          points: ordered.flatMap((run) => {
            const {ratio} = run.score
            return typeof ratio === 'number' ? [pointOf(run, ratio)] : []
          }),
        },
      ],
    },
  ]
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
  run: Pick<EngineConfidenceRunDocument, 'isoWeek' | 'startedAt' | 'score' | 'knownBugs'>,
): EngineConfidenceDetail {
  const {score, knownBugs} = run
  return {
    isoWeek: run.isoWeek,
    startedAt: run.startedAt,
    files: score.status === 'measured' ? score.files : null,
    entries: knownBugs.status === 'measured' ? knownBugs.entries : null,
  }
}
