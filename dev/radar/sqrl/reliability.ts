import {RELIABILITY_WINDOW_WEEKS} from './inputs'

export interface SqrlTag {
  tag: string
  major: number
  minor: number
  patch: number
  prerelease?: string | null
  taggedAt: string
  publishedAt?: string | null
  deprecated?: string | null
}

export interface ReliabilityEvent {
  kind: 'deprecation' | 'hotpatch'
  tag: string
  day: string
}

const HOT_PATCH_HOURS = 72
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const WINDOW_DAYS = RELIABILITY_WINDOW_WEEKS * 7

/**
 * Trailing-window event count of the reference window (1 Jan to 2 Apr 2026),
 * frozen so a later deprecation of a version from that window cannot move
 * every score in the history.
 */
export const RELIABILITY_REFERENCE_COUNT = 4
export const RELIABILITY_REFERENCE_END_DAY = '2026-04-02'

function tagTime(tag: SqrlTag): number {
  return Date.parse(tag.publishedAt || tag.taggedAt)
}

export function utcDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10)
}

function earliest(tags: SqrlTag[]): SqrlTag {
  return tags.reduce((best, tag) => (tagTime(tag) < tagTime(best) ? tag : best))
}

function latest(tags: SqrlTag[]): SqrlTag {
  return tags.reduce((best, tag) => (tagTime(tag) > tagTime(best) ? tag : best))
}

interface Cluster {
  first: SqrlTag
  fixTag: SqrlTag | undefined
}

/** One cluster per npm deprecation message, dated at its first deprecated version, fixed by the next stable release of that major. */
function deprecationClusters(stable: SqrlTag[]): Cluster[] {
  const deprecated = stable.filter((tag) => Boolean(tag.deprecated))
  const messages = [...new Set(deprecated.flatMap((tag) => tag.deprecated ?? []))].sort()
  return messages.map((message) => {
    const group = deprecated.filter((tag) => tag.deprecated === message)
    const last = latest(group)
    const later = stable.filter(
      (tag) => tag.major === last.major && tagTime(tag) > tagTime(last) && tag.deprecated == null,
    )
    return {first: earliest(group), fixTag: later.length > 0 ? earliest(later) : undefined}
  })
}

/**
 * gitTag-derived incidents: one per deprecation cluster, plus each patch
 * published within 72h of its minor. The patch that fixes a cluster is not a
 * second incident, and with `dedupeClusters` neither is a hot-patch that was
 * itself deprecated, since it already sits inside a cluster.
 */
export function reliabilityEvents(
  tags: SqrlTag[],
  options: {dedupeClusters: boolean},
): ReliabilityEvent[] {
  const stable = tags.filter((tag) => tag.prerelease == null)
  const clusters = deprecationClusters(stable)
  const fixNames = clusters.flatMap((cluster) => (cluster.fixTag ? [cluster.fixTag.tag] : []))
  const deprecatedNames = options.dedupeClusters
    ? tags.filter((tag) => Boolean(tag.deprecated)).map((tag) => tag.tag)
    : []
  const notIncidents = new Set([...fixNames, ...deprecatedNames])
  const minors = new Map(
    stable.filter((tag) => tag.patch === 0).map((tag) => [`${tag.major}.${tag.minor}`, tag]),
  )
  const deprecations: ReliabilityEvent[] = clusters.map((cluster) => ({
    kind: 'deprecation',
    tag: cluster.first.tag,
    day: utcDay(tagTime(cluster.first)),
  }))
  const hotPatches: ReliabilityEvent[] = stable
    .filter((tag) => {
      const base = minors.get(`${tag.major}.${tag.minor}`)
      if (tag.patch === 0 || base === undefined) return false
      const hours = (tagTime(tag) - tagTime(base)) / HOUR_MS
      return hours <= HOT_PATCH_HOURS && !notIncidents.has(tag.tag)
    })
    .map((tag) => ({kind: 'hotpatch', tag: tag.tag, day: utcDay(tagTime(tag))}))
  return [...deprecations, ...hotPatches].toSorted((left, right) =>
    left.day.localeCompare(right.day),
  )
}

/** Events in the trailing window that ends on `endDay` (inclusive) and starts 91 days earlier (exclusive). */
export function eventsInWindow(events: ReliabilityEvent[], endDay: string): ReliabilityEvent[] {
  const startDay = utcDay(Date.parse(`${endDay}T00:00:00Z`) - WINDOW_DAYS * DAY_MS)
  return events.filter((event) => event.day > startDay && event.day <= endDay)
}
