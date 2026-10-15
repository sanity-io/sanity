export const SQRL_SERIES_QUERY = `*[_type == "sqrlScore" && git.branch == "main"] | order(git.committedAt asc) {
  score,
  scoreCommit,
  git{sha, committedAt}
}`

export const SQRL_LATEST_QUERY = `*[_type == "sqrlScore" && git.branch == "main"] | order(git.committedAt desc)[0] {
  _id,
  formulaVersion,
  computedAt,
  git{sha, committedAt, branch},
  score,
  scoreCommit,
  scoreRaw,
  host{calibrationMs, cpuModel},
  pillars[]{key, label, weight, score},
  inputs[]{key, label, pillar, weight, unit, value, referenceValue, ratio, contributionPoints, trend},
  reliability{windowWeeks, count, referenceCount, events[]{kind, tag, day}}
}`

export const SQRL_REFERENCE_CALIBRATION_MS = 7
export const SQRL_REFERENCE_SCORE = 100

export const DAY_MS = 24 * 60 * 60 * 1000

export const SQRL_PILLAR_ORDER = [
  'inp',
  'responsiveness',
  'load',
  'cpu',
  'memory',
  'reliability',
] as const

export type SqrlTrend = 'regression' | 'improvement' | 'neutral' | 'insufficient'

export interface SqrlSeriesDocument {
  score: number
  scoreCommit: number
  git: {sha: string; committedAt: string}
}

export interface SqrlPoint {
  score: number
  scoreCommit: number
  sha: string
  ms: number
}

export interface SqrlPillar {
  key: string
  label: string
  weight: number
  score: number
}

export interface SqrlInput {
  key: string
  label: string
  pillar: string
  weight: number
  unit: string
  value: number | null
  referenceValue: number
  ratio: number
  contributionPoints: number
  trend: SqrlTrend
}

export interface SqrlLatest {
  _id: string
  formulaVersion: number
  computedAt: string
  git: {sha: string; committedAt: string; branch: string}
  score: number
  scoreCommit: number
  scoreRaw: number
  host: {calibrationMs: number | null; cpuModel: string | null} | null
  pillars: SqrlPillar[]
  inputs: SqrlInput[]
  reliability: {
    windowWeeks: number
    count: number
    referenceCount: number
    events: {kind: 'deprecation' | 'hotpatch'; tag: string; day: string}[]
  } | null
}

export type SqrlState =
  | {status: 'loading'}
  | {status: 'error'; message: string}
  | {status: 'ready'; series: SqrlPoint[]; latest: SqrlLatest | null; asOfMs: number}

export interface SqrlChange {
  points: number
  fromMs: number
}

export interface SqrlChanges {
  sinceThirtyDays: SqrlChange | null
  sinceQuarterStart: SqrlChange | null
}

export function shapeSqrlSeries(documents: SqrlSeriesDocument[] | null | undefined): SqrlPoint[] {
  return (documents ?? [])
    .map((document): SqrlPoint => ({
      score: document.score,
      scoreCommit: document.scoreCommit,
      sha: document.git?.sha ?? 'unknown',
      ms: new Date(document.git?.committedAt ?? Number.NaN).getTime(),
    }))
    .filter((point) => Number.isFinite(point.ms) && Number.isFinite(point.score))
    .sort((left, right) => left.ms - right.ms)
}

export function filterSqrlByRange(
  points: SqrlPoint[],
  days: number | null,
  nowMs: number,
): SqrlPoint[] {
  if (days === null) return points
  const cutoff = nowMs - days * DAY_MS
  return points.filter((point) => point.ms >= cutoff)
}

export function quarterStartMs(nowMs: number): number {
  const now = new Date(nowMs)
  return Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1)
}

export function pointAtOrBefore(points: SqrlPoint[], targetMs: number): SqrlPoint | null {
  return points.findLast((point) => point.ms <= targetMs) ?? null
}

export function nearestPointIndex(points: SqrlPoint[], targetMs: number): number {
  return points.reduce(
    (best, point, index) =>
      Math.abs(point.ms - targetMs) < Math.abs(points[best].ms - targetMs) ? index : best,
    0,
  )
}

function changeSince(
  points: SqrlPoint[],
  latestScore: number,
  targetMs: number,
): SqrlChange | null {
  const baseline = pointAtOrBefore(points, targetMs)
  return baseline ? {points: latestScore - baseline.score, fromMs: baseline.ms} : null
}

export function sqrlChanges(points: SqrlPoint[], latestScore: number, nowMs: number): SqrlChanges {
  return {
    sinceThirtyDays: changeSince(points, latestScore, nowMs - 30 * DAY_MS),
    sinceQuarterStart: changeSince(points, latestScore, quarterStartMs(nowMs)),
  }
}

export function quarterLabel(nowMs: number): string {
  const now = new Date(nowMs)
  return `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`
}

export function formatScore(value: number): string {
  return value.toFixed(1)
}

export function formatSignedPoints(value: number): string {
  const rounded = Math.abs(value).toFixed(1)
  if (rounded === '0.0') return '0.0'
  return `${value > 0 ? '+' : '−'}${rounded}`
}

function pillarRank(key: string): number {
  const index = SQRL_PILLAR_ORDER.findIndex((candidate) => candidate === key)
  return index === -1 ? SQRL_PILLAR_ORDER.length : index
}

export function orderedPillars(pillars: SqrlPillar[] | null | undefined): SqrlPillar[] {
  return [...(pillars ?? [])].sort((left, right) => pillarRank(left.key) - pillarRank(right.key))
}

export function regressedInputs(inputs: SqrlInput[] | null | undefined): SqrlInput[] {
  return (inputs ?? [])
    .filter((input) => input.trend === 'regression')
    .sort((left, right) => left.contributionPoints - right.contributionPoints)
}

export function pillarLabelFor(latest: SqrlLatest, pillarKey: string): string {
  return latest.pillars?.find((pillar) => pillar.key === pillarKey)?.label ?? pillarKey
}

export function formatCommitDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function hostNote(latest: SqrlLatest | null): string {
  const reference = `Host-adjusted to a ${SQRL_REFERENCE_CALIBRATION_MS.toFixed(1)} ms reference calibration`
  if (latest === null) return `${reference}.`
  const calibration = latest.host?.calibrationMs
  const cpuModel = latest.host?.cpuModel
  const cpuSuffix = cpuModel ? ` on ${cpuModel}` : ''
  const measured =
    typeof calibration === 'number'
      ? ` (this commit measured ${calibration.toFixed(1)} ms${cpuSuffix})`
      : ''
  return `${reference}${measured}; unadjusted score ${formatScore(latest.scoreRaw)}.`
}
