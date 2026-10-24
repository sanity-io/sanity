import {type Metric} from 'web-vitals'

import {
  type PerformanceSoftNavigationMeasuredData,
  type SoftNavigationChange,
  type SoftNavigationVital,
} from '../__telemetry__/performance.telemetry'
import {type PaintedElement, toLcpElementKind} from './lcpElementKind'
import {describeChange} from './softNavigationChange'
import {toSoftNavRoute} from './softNavRoute'

/** @internal */
export const SOFT_NAVIGATION_SAMPLE_RATE = 0.1

/** @internal */
export const MAX_SOFT_NAVIGATION_EVENTS = 200

/**
 * How long a soft nav stays open after the next one starts. web-vitals reports the
 * previous nav's INP from an idle callback with a 1s timeout, so this leaves headroom.
 *
 * @internal
 */
export const SOFT_NAVIGATION_SETTLE_MS = 3000

// No soft nav needs its paint metrics when it only changed UI state on an already painted pane.
const CHANGES_WITHOUT_PAINT = new Set<SoftNavigationChange>([
  'view-change',
  'inspector-toggle',
  'perspective-change',
  'filter-change',
])

/** @internal */
export interface SoftNavigationMetric extends Pick<
  Metric,
  'name' | 'value' | 'rating' | 'navigationType' | 'navigationId' | 'navigationURL'
> {
  entries: ReadonlyArray<PerformanceEntry & Partial<PaintedElement>>
}

interface PendingSoftNavigation {
  navigationId: number
  navigationURL: string
  previousURL: string
  workspace: SoftNavigationWorkspace
  lcp?: PerformanceSoftNavigationMeasuredData['lcp']
  fcp?: SoftNavigationVital
  inp?: SoftNavigationVital
  cls?: SoftNavigationVital
}

/** @internal */
export interface SoftNavigationWorkspace {
  basePath: string
  toolNames: string[]
}

interface SoftNavigationReporterOptions {
  /** The URL before the first soft nav. */
  initialURL: string
  getWorkspace: () => SoftNavigationWorkspace
  /** The URL the browser left for `navigationURL`, when known. */
  getPreviousURL?: (navigationURL: string) => string | undefined
  send: (event: PerformanceSoftNavigationMeasuredData) => void
}

/** @internal */
export interface SoftNavigationReporter {
  record: (metric: SoftNavigationMetric) => void
  /** Sends every pending soft nav. Call when the page hides. */
  flush: () => void
}

function toVital(metric: SoftNavigationMetric): SoftNavigationVital {
  return {value: metric.value, rating: metric.rating}
}

function toLcp(metric: SoftNavigationMetric): PerformanceSoftNavigationMeasuredData['lcp'] {
  const paintedEntry = metric.entries.at(-1)
  return {
    ...toVital(metric),
    elementKind: toLcpElementKind({
      element: paintedEntry?.element ?? null,
      url: paintedEntry?.url ?? '',
    }),
  }
}

function withMetric(
  navigation: PendingSoftNavigation,
  metric: SoftNavigationMetric,
): PendingSoftNavigation {
  switch (metric.name) {
    case 'LCP':
      return {...navigation, lcp: toLcp(metric)}
    case 'FCP':
      return {...navigation, fcp: toVital(metric)}
    case 'INP':
      return {...navigation, inp: toVital(metric)}
    case 'CLS':
      return {...navigation, cls: toVital(metric)}
    default:
      return navigation
  }
}

/**
 * Buffers web-vitals soft-navigation metrics by `navigationId` and sends one event per
 * soft nav once its metrics are final: the next soft nav has settled, or the page hides.
 *
 * @internal
 */
export function createSoftNavigationReporter(
  options: SoftNavigationReporterOptions,
): SoftNavigationReporter {
  const pending = new Map<number, PendingSoftNavigation>()
  const sentNavigationIds = new Set<number>()
  let latestURL = options.initialURL
  let newestNavigationId = -1

  function toEvent(navigation: PendingSoftNavigation): PerformanceSoftNavigationMeasuredData {
    const {basePath, toolNames} = navigation.workspace
    const route = toSoftNavRoute({navigationURL: navigation.navigationURL, basePath, toolNames})
    const change = describeChange({
      previousURL: navigation.previousURL,
      nextURL: navigation.navigationURL,
      nextRoute: route,
      basePath,
    })
    const paintMetrics = CHANGES_WITHOUT_PAINT.has(change)
      ? {}
      : {lcp: navigation.lcp, fcp: navigation.fcp}
    const metrics = {...paintMetrics, inp: navigation.inp, cls: navigation.cls}
    const presentMetrics = Object.fromEntries(Object.entries(metrics).filter(([, vital]) => vital))

    return {
      navigationId: navigation.navigationId,
      navigationType: 'soft-navigation',
      route,
      change,
      sampleRate: SOFT_NAVIGATION_SAMPLE_RATE,
      ...presentMetrics,
    }
  }

  function send(navigationIds: number[]) {
    navigationIds.forEach((navigationId) => {
      const navigation = pending.get(navigationId)
      pending.delete(navigationId)
      sentNavigationIds.add(navigationId)
      if (navigation && sentNavigationIds.size <= MAX_SOFT_NAVIGATION_EVENTS) {
        options.send(toEvent(navigation))
      }
    })
  }

  function sendOlderThan(navigationId: number) {
    send([...pending.keys()].filter((pendingId) => pendingId < navigationId))
  }

  function start(metric: SoftNavigationMetric): PendingSoftNavigation {
    const navigationURL = metric.navigationURL ?? ''
    const previousURL = options.getPreviousURL?.(navigationURL) ?? latestURL
    const workspace = options.getWorkspace()
    if (metric.navigationId > newestNavigationId) {
      newestNavigationId = metric.navigationId
      latestURL = navigationURL
    }
    if (pending.size > 0) {
      const settlingBefore = newestNavigationId
      setTimeout(() => sendOlderThan(settlingBefore), SOFT_NAVIGATION_SETTLE_MS)
    }
    return {navigationId: metric.navigationId, navigationURL, previousURL, workspace}
  }

  function acceptsMetric(metric: SoftNavigationMetric): boolean {
    if (metric.navigationType !== 'soft-navigation') return false
    if (sentNavigationIds.has(metric.navigationId)) return false
    return sentNavigationIds.size < MAX_SOFT_NAVIGATION_EVENTS
  }

  function record(metric: SoftNavigationMetric) {
    if (acceptsMetric(metric)) {
      const navigation = pending.get(metric.navigationId) ?? start(metric)
      pending.set(metric.navigationId, withMetric(navigation, metric))
    }
  }

  function flush() {
    send([...pending.keys()])
  }

  return {record, flush}
}
