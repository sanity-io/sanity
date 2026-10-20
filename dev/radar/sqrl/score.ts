/**
 * SQRL (Studio Quality: Reliability & Latency): one score per main commit,
 * 100 × the weighted geometric mean over inputs of reference ÷ current, all
 * inputs lower-is-better, rebased so the reference window reads 100. Pure:
 * projected benchRun and gitTag documents in, sqrlScore documents out.
 */
import {radarIdSlug, sqrlScoreId} from '@repo/utils/radar-ids'

import {type TrendSeries, type TrendUnit} from '../tools/trends/data'
import {computeDrift} from '../tools/trends/drift'
import {
  chain,
  headlineWeights,
  type LogRow,
  logRatioRows,
  median,
  pillarWeights,
  referenceValues,
  rollingMedian,
  type ValueMap,
  type Weights,
} from './composite'
import {
  COMMIT_WINDOW,
  FORMULA_VERSION,
  hostAdjustedValue,
  PILLAR_LABELS,
  PILLAR_ORDER,
  RELIABILITY_KEY,
  RELIABILITY_WINDOW_WEEKS,
  type SqrlInputDefinition,
  SQRL_INPUTS,
  type SqrlPillarKey,
  type SqrlRun,
  type SqrlUnit,
} from './inputs'
import {
  eventsInWindow,
  type ReliabilityEvent,
  RELIABILITY_REFERENCE_COUNT,
  reliabilityEvents,
  type SqrlTag,
  utcDay,
} from './reliability'

export type SqrlTrend = 'regression' | 'improvement' | 'neutral' | 'insufficient'

export interface SqrlScoreDocument {
  _type: 'sqrlScore'
  _id: string
  formulaVersion: number
  computedAt: string
  git: {sha: string; committedAt: string; branch: 'main'}
  benchRunIds: string[]
  score: number
  scoreCommit: number
  scoreRaw: number
  host: {calibrationMs: number | null; cpuModel: string | null}
  pillars: {_key: string; key: SqrlPillarKey; label: string; weight: number; score: number}[]
  inputs: {
    _key: string
    key: string
    label: string
    pillar: SqrlPillarKey
    weight: number
    unit: SqrlUnit
    value: number | null
    referenceValue: number
    ratio: number
    contributionPoints: number
    trend: SqrlTrend
  }[]
  reliability: {
    windowWeeks: number
    count: number
    referenceCount: number
    events: {_key: string; kind: ReliabilityEvent['kind']; tag: string; day: string}[]
  }
}

export interface SqrlOptions {
  inputs?: readonly SqrlInputDefinition[]
  /** Count a hot-patch that sits inside a deprecation cluster once, with the cluster. */
  dedupeClusters?: boolean
  computedAt?: string
}

interface CommitPoint {
  sha: string
  time: number
  day: string
  committedAt: string
  runIds: string[]
  calibrations: number[]
  cpuModel: string | null
  adjusted: ValueMap
  raw: ValueMap
}

const RELIABILITY_LABEL =
  'Incidents, trailing 13 weeks (deprecation clusters + 72h hot-patches, +1)'

const DRIFT_UNITS: Record<SqrlUnit, TrendUnit> = {
  ms: 'ms',
  bytes: 'bytes',
  count: 'count',
  cls: 'cls',
  megabytes: 'megabytes',
  perMinute: 'mb-per-min',
  events: 'count',
}

function runTime(run: SqrlRun): number {
  return Date.parse(run.git.committedAt || run.startedAt)
}

function present(value: number | null | undefined): value is number {
  return typeof value === 'number' && value !== 0
}

function mergedValues(perRun: ValueMap[], keys: string[]): ValueMap {
  return Object.fromEntries(
    keys.map((key) => {
      const measured = perRun.map((runValues) => runValues[key]).filter(present)
      return [key, measured.length > 0 ? median(measured) : null]
    }),
  )
}

/** One point per sha, in first-measured order; re-runs of a commit merge by median. */
function commitPoints(runs: SqrlRun[], inputs: readonly SqrlInputDefinition[]): CommitPoint[] {
  const keys = inputs.map((input) => input.key)
  const ordered = runs
    .map((run, index) => ({run, index, time: runTime(run)}))
    .toSorted((left, right) => left.time - right.time || left.index - right.index)
  const groups = ordered.reduce((bySha, entry) => {
    bySha.set(entry.run.git.sha, [...(bySha.get(entry.run.git.sha) ?? []), entry])
    return bySha
  }, new Map<string, typeof ordered>())
  return [...groups].map(([sha, group]) => {
    const perRun = group.map(({run}) => {
      const parts = inputs.map((input) => [input, input.extract(run)] as const)
      return {
        adjusted: Object.fromEntries(
          parts.map(([input, extracted]) => [input.key, hostAdjustedValue(extracted, input.beta)]),
        ),
        raw: Object.fromEntries(
          parts.map(([input, extracted]) => [input.key, hostAdjustedValue(extracted, 0)]),
        ),
      }
    })
    const first = group[0]
    return {
      sha,
      time: first.time,
      day: utcDay(first.time),
      committedAt: first.run.git.committedAt || first.run.startedAt,
      runIds: group.map(({run}) => run._id),
      calibrations: group
        .map(({run}) => run.runner?.calibrationMs)
        .filter((value): value is number => typeof value === 'number'),
      cpuModel: group.at(-1)?.run.runner?.cpuModel ?? null,
      adjusted: mergedValues(
        perRun.map((values) => values.adjusted),
        keys,
      ),
      raw: mergedValues(
        perRun.map((values) => values.raw),
        keys,
      ),
    }
  })
}

interface Composite {
  levels: number[]
  weights: Weights[]
  references: ValueMap
  rows: LogRow[]
}

function composite(
  series: ValueMap[],
  keys: string[],
  pillarOf: (key: string) => SqrlPillarKey,
): Composite {
  const references = {
    ...referenceValues(series, keys),
    [RELIABILITY_KEY]: RELIABILITY_REFERENCE_COUNT + 1,
  }
  const rows = logRatioRows(series, references, keys)
  const result = chain(rows, keys, (row) => headlineWeights(row, keys, pillarOf))
  return {...result, references, rows}
}

function scoreFromLevel(level: number, scale: number): number {
  return 100 * Math.exp(level) * scale
}

function rebaseScale(levels: number[]): number {
  return 100 / median(levels.slice(0, COMMIT_WINDOW).map((level) => 100 * Math.exp(level)))
}

function trendFor(
  key: string,
  unit: SqrlUnit,
  points: {time: number; value: number | null; sha: string; runId: string}[],
): SqrlTrend {
  const measured = points.filter((point): point is typeof point & {value: number} =>
    present(point.value),
  )
  const series: TrendSeries = {
    key,
    title: key,
    unit: DRIFT_UNITS[unit],
    description: '',
    goal: 'lower',
    group: 'vitals',
    lines: [
      {
        branch: 'main',
        points: measured.map((point) => ({
          date: new Date(point.time),
          value: point.value,
          sha: point.sha,
          runId: point.runId,
        })),
      },
    ],
  }
  return computeDrift([series])[0]?.direction ?? 'insufficient'
}

/**
 * Splits `score - 100` across inputs: weight × ln(reference-window value ÷
 * current value), on the logarithmic mean of score and 100, with the
 * chain-linking residual spread by weight so the points add up exactly. The
 * reference-window value is the median of the first 7 commits, which is each
 * performance input's reference; for Reliability it is the window's own count,
 * not the Jan-Apr reference, since the rebase already pins that head start to 100.
 */
function contributionPoints(
  score: number,
  weights: Weights,
  values: ValueMap,
  windowReferences: ValueMap,
): (key: string) => number {
  const totalLog = Math.log(score / 100)
  const pointsPerLog = Math.abs(totalLog) < 1e-12 ? 100 : (score - 100) / totalLog
  const keys = Object.keys(weights)
  const logOf = (key: string) => {
    const value = values[key]
    const windowReference = windowReferences[key]
    return value && windowReference ? weights[key] * Math.log(windowReference / value) : 0
  }
  const residual = totalLog - keys.reduce((total, key) => total + logOf(key), 0)
  const weightTotal = keys.reduce((total, key) => total + weights[key], 0)
  return (key) => pointsPerLog * (logOf(key) + (residual * (weights[key] ?? 0)) / weightTotal)
}

/** A sqrlScore document for every main commit with a benchRun, oldest first. */
export function computeSqrlScores(
  runs: SqrlRun[],
  tags: SqrlTag[],
  options: SqrlOptions = {},
): SqrlScoreDocument[] {
  const inputs = options.inputs ?? SQRL_INPUTS
  const computedAt = options.computedAt ?? new Date().toISOString()
  const inputByKey = new Map(inputs.map((input) => [input.key, input]))
  const inputKeys = inputs.map((input) => input.key)
  const keys = [...inputKeys, RELIABILITY_KEY]
  const pillarOf = (key: string): SqrlPillarKey => inputByKey.get(key)?.pillar ?? 'reliability'

  const events = reliabilityEvents(tags, {dedupeClusters: options.dedupeClusters ?? true})
  const points = commitPoints(runs, inputs)
  const windowEvents = points.map((point) => eventsInWindow(events, point.day))
  const withReliability = (series: ValueMap[]): ValueMap[] =>
    series.map((values, index) => ({...values, [RELIABILITY_KEY]: windowEvents[index].length + 1}))

  const adjusted = withReliability(points.map((point) => point.adjusted))
  const smoothed = withReliability(
    rollingMedian(
      points.map((point) => point.adjusted),
      inputKeys,
    ),
  )
  const raw = withReliability(points.map((point) => point.raw))

  const commit = composite(adjusted, keys, pillarOf)
  const headline = composite(smoothed, keys, pillarOf)
  const unadjusted = composite(raw, keys, pillarOf)
  const scale = rebaseScale(commit.levels)
  const rawScale = rebaseScale(unadjusted.levels)
  const windowReferences = referenceValues(smoothed, keys)

  // Rebased like the headline, so a pillar above 100 is better than the reference window and its sign matches its points
  const pillarScores = new Map(
    PILLAR_ORDER.map((pillar) => {
      const members = keys.filter((key) => pillarOf(key) === pillar)
      const pillarScale = rebaseScale(chain(commit.rows, members, pillarWeights(members)).levels)
      const levels = chain(headline.rows, members, pillarWeights(members)).levels
      return [pillar, levels.map((level) => scoreFromLevel(level, pillarScale))] as const
    }),
  )

  return points.map((point, index) => {
    const weights = headline.weights[index]
    const score = scoreFromLevel(headline.levels[index], scale)
    const pointsFor = contributionPoints(score, weights, smoothed[index], windowReferences)
    const history = points.slice(0, index + 1)
    const activeKeys = keys.filter((key) => weights[key] !== undefined)
    const pillarKeys = PILLAR_ORDER.filter((pillar) =>
      activeKeys.some((key) => pillarOf(key) === pillar),
    )
    return {
      _type: 'sqrlScore',
      _id: sqrlScoreId(point.sha),
      formulaVersion: FORMULA_VERSION,
      computedAt,
      git: {sha: point.sha, committedAt: point.committedAt, branch: 'main'},
      benchRunIds: point.runIds,
      score,
      scoreCommit: scoreFromLevel(commit.levels[index], scale),
      scoreRaw: scoreFromLevel(unadjusted.levels[index], rawScale),
      host: {
        calibrationMs: point.calibrations.length > 0 ? median(point.calibrations) : null,
        cpuModel: point.cpuModel,
      },
      pillars: pillarKeys.map((pillar) => ({
        _key: pillar,
        key: pillar,
        label: PILLAR_LABELS[pillar],
        weight: activeKeys
          .filter((key) => pillarOf(key) === pillar)
          .reduce((total, key) => total + weights[key], 0),
        score: pillarScores.get(pillar)?.[index] ?? 100,
      })),
      inputs: activeKeys.map((key) => {
        const input = inputByKey.get(key)
        const unit = input?.unit ?? 'events'
        const value = smoothed[index][key]
        const referenceValue = headline.references[key] ?? 0
        return {
          _key: key,
          key,
          label: input?.label ?? RELIABILITY_LABEL,
          pillar: pillarOf(key),
          weight: weights[key],
          unit,
          value,
          referenceValue,
          ratio: value ? referenceValue / value : 1,
          contributionPoints: pointsFor(key),
          trend: trendFor(
            key,
            unit,
            history.map((entry, entryIndex) => ({
              time: entry.time,
              value: adjusted[entryIndex][key],
              sha: entry.sha,
              runId: entry.runIds[0],
            })),
          ),
        }
      }),
      reliability: {
        windowWeeks: RELIABILITY_WINDOW_WEEKS,
        count: windowEvents[index].length,
        referenceCount: RELIABILITY_REFERENCE_COUNT,
        events: windowEvents[index].map((event) => ({
          _key: radarIdSlug(`${event.kind}-${event.tag}`),
          ...event,
        })),
      },
    }
  })
}
