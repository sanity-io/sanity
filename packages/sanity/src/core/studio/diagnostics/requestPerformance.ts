const DATA_URL_MATCHER = /\/(v\d+|vX|v\d{4}-\d{2}-\d{2})\/data\/([a-z]+)\/([^/?]+)/

/** @internal */
export const DEFAULT_REQUEST_PERFORMANCE_CAPACITY = 500

/** @internal */
export interface RequestPerformanceTarget {
  dataset: string
  projectId: string
}

/** @internal */
export interface RequestPerformanceEntry extends RequestPerformanceTarget {
  apiVersion: string
  bucket: string
  durationMs: number
  startedAt: string
  status: 'success' | 'error' | 'aborted'
}

/** @internal */
export interface RequestPerformanceBucketSummary {
  bucket: string
  count: number
  maxMs: number
  medianMs: number
  p95Ms: number
}

/** @internal */
export interface RequestPerformanceSessionSummary {
  buckets: RequestPerformanceBucketSummary[]
  startedAt: string
  totalRequests: number
}

/** @internal */
export interface RequestPerformanceSnapshot extends RequestPerformanceTarget {
  entries: RequestPerformanceEntry[]
  maxEntries: number
  sessionSummary: RequestPerformanceSessionSummary
  totalRequests: number
  truncated: boolean
}

/** @internal */
export interface RequestPerformanceTracker {
  getSnapshot: (target: RequestPerformanceTarget) => RequestPerformanceSnapshot
  record: (entry: RequestPerformanceEntry) => void
}

/** @internal */
export function getRequestBucket(
  url: string,
): {apiVersion: string; bucket: string; dataset: string} | undefined {
  const match = url.match(DATA_URL_MATCHER)
  const apiVersion = match?.[1]
  const bucket = match?.[2]
  const dataset = match?.[3]
  return apiVersion && bucket && dataset ? {apiVersion, bucket, dataset} : undefined
}

/** @internal */
export function createRequestPerformanceTracker(
  maxEntries = DEFAULT_REQUEST_PERFORMANCE_CAPACITY,
): RequestPerformanceTracker {
  const capacity = Math.max(1, Math.floor(maxEntries))
  const entries: RequestPerformanceEntry[] = []
  const sessionStartedAt = new Date().toISOString()
  const targetSummaries = new Map<string, TargetSummary>()
  let nextIndex = 0

  return {
    getSnapshot: (target) => {
      const orderedEntries =
        entries.length < capacity || nextIndex === 0
          ? entries
          : [...entries.slice(nextIndex), ...entries.slice(0, nextIndex)]

      const targetEntries = orderedEntries.filter(
        (entry) => entry.projectId === target.projectId && entry.dataset === target.dataset,
      )
      const targetSummary = targetSummaries.get(getTargetKey(target))
      const totalRequests = targetSummary?.totalRequests ?? 0

      return {
        ...target,
        entries: targetEntries.map((entry) => ({...entry})),
        maxEntries: capacity,
        sessionSummary: {
          buckets: targetSummary ? summarizeBuckets(targetSummary.buckets) : [],
          startedAt: sessionStartedAt,
          totalRequests,
        },
        totalRequests,
        truncated: totalRequests > targetEntries.length,
      }
    },
    record: (entry) => {
      const targetKey = getTargetKey(entry)
      const targetSummary = targetSummaries.get(targetKey) ?? createTargetSummary()
      targetSummary.totalRequests += 1
      targetSummaries.set(targetKey, targetSummary)

      if (entry.status !== 'aborted' && Number.isFinite(entry.durationMs)) {
        const bucketSummary = targetSummary.buckets.get(entry.bucket) ?? createBucketSummary()
        const durationMs = Math.max(0, entry.durationMs)
        bucketSummary.count += 1
        bucketSummary.maxMs = Math.max(bucketSummary.maxMs, durationMs)
        bucketSummary.median.add(durationMs)
        bucketSummary.p95.add(durationMs)
        targetSummary.buckets.set(entry.bucket, bucketSummary)
      }

      if (entries.length < capacity) {
        entries.push({...entry})
        return
      }

      entries[nextIndex] = {...entry}
      nextIndex = (nextIndex + 1) % capacity
    },
  }
}

/** Browser-session request performance shared by the Studio request handler and diagnostics. */
export const studioRequestPerformance = createRequestPerformanceTracker()

function getTargetKey({dataset, projectId}: RequestPerformanceTarget): string {
  return JSON.stringify([projectId, dataset])
}

interface BucketSummaryAccumulator {
  count: number
  maxMs: number
  median: QuantileEstimator
  p95: QuantileEstimator
}

interface TargetSummary {
  buckets: Map<string, BucketSummaryAccumulator>
  totalRequests: number
}

function createTargetSummary(): TargetSummary {
  return {buckets: new Map(), totalRequests: 0}
}

function createBucketSummary(): BucketSummaryAccumulator {
  return {
    count: 0,
    maxMs: 0,
    median: new QuantileEstimator(0.5),
    p95: new QuantileEstimator(0.95),
  }
}

function summarizeBuckets(
  buckets: Map<string, BucketSummaryAccumulator>,
): RequestPerformanceBucketSummary[] {
  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([bucket, summary]) => ({
      bucket,
      count: summary.count,
      maxMs: round(summary.maxMs),
      medianMs: round(summary.median.value()),
      p95Ms: round(summary.p95.value()),
    }))
}

// P² keeps five marker positions per quantile instead of retaining every sample.
// Small sample sets are kept exact until the estimator has enough observations to settle.
class QuantileEstimator {
  readonly #desiredPositionIncrements: number[]
  readonly #initialSamples: number[] = []
  readonly #markerHeights: number[] = []
  readonly #markerPositions: number[] = []
  readonly #desiredMarkerPositions: number[] = []
  readonly #quantile: number
  #exactSamples: number[] | undefined = []

  constructor(quantile: number) {
    this.#quantile = quantile
    this.#desiredPositionIncrements = [0, quantile / 2, quantile, (1 + quantile) / 2, 1]
  }

  add(value: number): void {
    if (this.#exactSamples) {
      if (this.#exactSamples.length < 20) this.#exactSamples.push(value)
      else this.#exactSamples = undefined
    }

    if (this.#initialSamples.length < 5) {
      this.#initialSamples.push(value)
      if (this.#initialSamples.length === 5) this.#initializeMarkers()
      return
    }

    const markerCell = this.#findMarkerCell(value)
    for (let index = markerCell + 1; index < 5; index += 1) {
      this.#markerPositions[index] += 1
    }
    for (let index = 0; index < 5; index += 1) {
      this.#desiredMarkerPositions[index] += this.#desiredPositionIncrements[index]
    }

    for (let index = 1; index < 4; index += 1) this.#adjustMarker(index)
  }

  value(): number {
    if (this.#exactSamples) return percentile(this.#exactSamples, this.#quantile)
    return this.#markerHeights[2] ?? 0
  }

  #adjustMarker(index: number): void {
    const difference = this.#desiredMarkerPositions[index] - this.#markerPositions[index]
    const canMoveUp =
      difference >= 1 && this.#markerPositions[index + 1] - this.#markerPositions[index] > 1
    const canMoveDown =
      difference <= -1 && this.#markerPositions[index - 1] - this.#markerPositions[index] < -1
    if (!canMoveUp && !canMoveDown) return

    const direction = difference > 0 ? 1 : -1
    const estimate = this.#parabolicEstimate(index, direction)
    const lower = this.#markerHeights[index - 1]
    const upper = this.#markerHeights[index + 1]

    this.#markerHeights[index] =
      estimate > lower && estimate < upper ? estimate : this.#linearEstimate(index, direction)
    this.#markerPositions[index] += direction
  }

  #findMarkerCell(value: number): number {
    if (value < this.#markerHeights[0]) {
      this.#markerHeights[0] = value
      return 0
    }

    for (let index = 1; index < 5; index += 1) {
      if (value < this.#markerHeights[index]) return index - 1
    }

    this.#markerHeights[4] = value
    return 3
  }

  #initializeMarkers(): void {
    this.#markerHeights.push(...this.#initialSamples.toSorted((left, right) => left - right))
    this.#markerPositions.push(1, 2, 3, 4, 5)
    this.#desiredMarkerPositions.push(
      1,
      1 + 2 * this.#quantile,
      1 + 4 * this.#quantile,
      3 + 2 * this.#quantile,
      5,
    )
  }

  #linearEstimate(index: number, direction: number): number {
    return (
      this.#markerHeights[index] +
      (direction * (this.#markerHeights[index + direction] - this.#markerHeights[index])) /
        (this.#markerPositions[index + direction] - this.#markerPositions[index])
    )
  }

  #parabolicEstimate(index: number, direction: number): number {
    const currentPosition = this.#markerPositions[index]
    const lowerPosition = this.#markerPositions[index - 1]
    const upperPosition = this.#markerPositions[index + 1]
    const currentHeight = this.#markerHeights[index]

    return (
      currentHeight +
      (direction / (upperPosition - lowerPosition)) *
        (((currentPosition - lowerPosition + direction) *
          (this.#markerHeights[index + 1] - currentHeight)) /
          (upperPosition - currentPosition) +
          ((upperPosition - currentPosition - direction) *
            (currentHeight - this.#markerHeights[index - 1])) /
            (currentPosition - lowerPosition))
    )
  }
}

function percentile(values: number[], quantile: number): number {
  const sorted = values.toSorted((left, right) => left - right)
  const index = Math.max(0, Math.ceil(sorted.length * quantile) - 1)
  return sorted[index] ?? 0
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
