const DATA_URL_MATCHER = /\/(v\d+|vX|v\d{4}-\d{2}-\d{2})\/data\/([a-z]+)\//

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
export interface RequestPerformanceSnapshot extends RequestPerformanceTarget {
  entries: RequestPerformanceEntry[]
  maxEntries: number
  totalRequests: number
  truncated: boolean
}

/** @internal */
export interface RequestPerformanceTracker {
  getSnapshot: (target: RequestPerformanceTarget) => RequestPerformanceSnapshot
  record: (entry: RequestPerformanceEntry) => void
}

/** @internal */
export function getRequestBucket(url: string): {apiVersion: string; bucket: string} | undefined {
  const match = url.match(DATA_URL_MATCHER)
  const apiVersion = match?.[1]
  const bucket = match?.[2]
  return apiVersion && bucket ? {apiVersion, bucket} : undefined
}

/** @internal */
export function createRequestPerformanceTracker(
  maxEntries = DEFAULT_REQUEST_PERFORMANCE_CAPACITY,
): RequestPerformanceTracker {
  const capacity = Math.max(1, Math.floor(maxEntries))
  const entries: RequestPerformanceEntry[] = []
  const targetRequestCounts = new Map<string, number>()
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
      const totalRequests = targetRequestCounts.get(getTargetKey(target)) ?? 0

      return {
        ...target,
        entries: targetEntries.map((entry) => ({...entry})),
        maxEntries: capacity,
        totalRequests,
        truncated: totalRequests > targetEntries.length,
      }
    },
    record: (entry) => {
      const targetKey = getTargetKey(entry)
      targetRequestCounts.set(targetKey, (targetRequestCounts.get(targetKey) ?? 0) + 1)

      if (entries.length < capacity) {
        entries.push({...entry})
        return
      }

      entries[nextIndex] = {...entry}
      nextIndex = (nextIndex + 1) % capacity
    },
  }
}

function getTargetKey({dataset, projectId}: RequestPerformanceTarget): string {
  return JSON.stringify([projectId, dataset])
}
