import {
  type EventTimingSample,
  type InteractionContentfulPaintSample,
  type LayoutShiftSample,
  type MeasureSample,
  type PaintedElementKind,
  type SoftNavigationSample,
} from '../instrumentation/types'

export interface SoftNavigationMeasurement {
  label: string
  /** Null when no paint was credited to the click. */
  softLcpMs: number | null
  lcpElement: string | null
  lcpElementKind: PaintedElementKind | null
  softFcpMs: number
  /** Includes the navigating click. */
  softInpMs: number | null
  softClsScore: number
  clickToReadyMs: number
}

export type SoftNavigationMetric = Exclude<
  keyof SoftNavigationMeasurement,
  'label' | 'lcpElement' | 'lcpElementKind'
>

export const SOFT_NAVIGATION_METRICS: SoftNavigationMetric[] = [
  'softLcpMs',
  'softFcpMs',
  'softInpMs',
  'softClsScore',
  'clickToReadyMs',
]

/** Radar classifies hard-navigation vitals by label suffix, so these never end in one. */
const METRIC_LABELS: Record<SoftNavigationMetric, string> = {
  softLcpMs: 'soft LCP time',
  softFcpMs: 'soft FCP time',
  softInpMs: 'soft INP latency',
  softClsScore: 'soft CLS score',
  clickToReadyMs: 'click to ready',
}

export function softNavigationMetricLabel(label: string, metric: SoftNavigationMetric): string {
  return `nav:${label} / ${METRIC_LABELS[metric]}`
}

const NAVIGATE_MEASURE_PREFIX = 'bench:navigate:'
/** The click's timestamp and the soft navigation's startTime differ by rounding, never by a frame. */
const CLICK_MATCH_MS = 16
const CLS_WINDOW_GAP_MS = 1000
const CLS_WINDOW_MAX_MS = 5000

export interface SoftNavigationEntries {
  measures: MeasureSample[]
  softNavigations: SoftNavigationSample[]
  events: EventTimingSample[]
  layoutShifts: LayoutShiftSample[]
  interactionContentfulPaints: InteractionContentfulPaintSample[]
}

export interface SoftNavigationResult {
  navigations: SoftNavigationMeasurement[]
  /** URLs of soft navigations no navigate step drove. */
  unexpected: string[]
}

/** Takes a whole session's entries: a larger paint of an interaction can land after a later drain. */
export function measureSoftNavigations(entries: SoftNavigationEntries): SoftNavigationResult {
  const navigateMeasures = entries.measures.filter((measure) =>
    measure.name.startsWith(NAVIGATE_MEASURE_PREFIX),
  )
  const startedBy = (softNavigation: SoftNavigationSample) =>
    navigateMeasures.find(
      (measure) => Math.abs(measure.startTime - softNavigation.startTime) <= CLICK_MATCH_MS,
    )
  const largestPaints = largestPaintByInteraction(entries.interactionContentfulPaints)
  const navigatingInteractions = new Map(
    entries.softNavigations.map((softNavigation) => [
      softNavigation.interactionId,
      softNavigation.navigationId,
    ]),
  )
  const latencies = interactionLatenciesByNavigation(entries.events, navigatingInteractions)

  const navigations = entries.softNavigations.flatMap((softNavigation) => {
    const measure = startedBy(softNavigation)
    if (measure === undefined) return []
    const largestPaint = largestPaints.get(softNavigation.interactionId)
    const navigationLatencies = latencies.get(softNavigation.navigationId) ?? []
    return [
      {
        label: measure.name.slice(NAVIGATE_MEASURE_PREFIX.length),
        softLcpMs: largestPaint
          ? largestPaint.startTime + largestPaint.duration - softNavigation.startTime
          : null,
        lcpElement: largestPaint?.element ?? null,
        lcpElementKind: largestPaint?.elementKind ?? null,
        softFcpMs: softNavigation.duration,
        softInpMs: navigationLatencies.length > 0 ? Math.max(...navigationLatencies) : null,
        softClsScore: cumulativeLayoutShift(
          entries.layoutShifts.filter(
            (layoutShift) => layoutShift.navigationId === softNavigation.navigationId,
          ),
        ),
        clickToReadyMs: measure.duration,
      },
    ]
  })

  return {
    navigations,
    unexpected: entries.softNavigations
      .filter((softNavigation) => startedBy(softNavigation) === undefined)
      .map((softNavigation) => softNavigation.url),
  }
}

function largestPaintByInteraction(
  paints: InteractionContentfulPaintSample[],
): Map<number, InteractionContentfulPaintSample> {
  return paints.reduce((largest, candidate) => {
    const kept = largest.get(candidate.interactionId)
    if (kept === undefined || candidate.size > kept.size) {
      largest.set(candidate.interactionId, candidate)
    }
    return largest
  }, new Map<number, InteractionContentfulPaintSample>())
}

/** The navigating click fires before Chrome switches navigationId, so it is moved to the navigation it started. */
function interactionLatenciesByNavigation(
  events: EventTimingSample[],
  navigatingInteractions: Map<number, number>,
): Map<number, number[]> {
  const worstByInteraction = events
    .filter((event) => event.interactionId > 0)
    .reduce((worst, event) => {
      const kept = worst.get(event.interactionId)
      worst.set(event.interactionId, {
        navigationId:
          navigatingInteractions.get(event.interactionId) ??
          kept?.navigationId ??
          event.navigationId,
        duration: Math.max(kept?.duration ?? 0, event.duration),
      })
      return worst
    }, new Map<number, {navigationId: number; duration: number}>())
  return [...worstByInteraction.values()].reduce((byNavigation, {navigationId, duration}) => {
    byNavigation.set(navigationId, [...(byNavigation.get(navigationId) ?? []), duration])
    return byNavigation
  }, new Map<number, number[]>())
}

/** web-vitals CLS: the worst session window (shifts under 1s apart, 5s at most), ignoring shifts right after input. */
function cumulativeLayoutShift(layoutShifts: LayoutShiftSample[]): number {
  const windows = layoutShifts
    .toSorted((first, second) => first.startTime - second.startTime)
    .reduce<LayoutShiftSample[][]>((sessionWindows, layoutShift) => {
      if (layoutShift.hadRecentInput) return sessionWindows
      const current = sessionWindows.at(-1)
      const joinsCurrent =
        current !== undefined &&
        layoutShift.startTime - current[current.length - 1].startTime < CLS_WINDOW_GAP_MS &&
        layoutShift.startTime - current[0].startTime < CLS_WINDOW_MAX_MS
      if (joinsCurrent) {
        current.push(layoutShift)
        return sessionWindows
      }
      return [...sessionWindows, [layoutShift]]
    }, [])
  return Math.max(
    0,
    ...windows.map((sessionWindow) =>
      sessionWindow.reduce((sum, layoutShift) => sum + layoutShift.value, 0),
    ),
  )
}

const DETACHED_ELEMENT = '(detached)'

/** The ready check runs on animation frames, so the paint that shows the data can trail it by up to a frame. */
const READY_FRAME_MS = 16

/** Studio swaps the title element as the form turns editable, so a detached element passes when its timing holds. */
export function isMiscreditedDocumentOpen(navigation: SoftNavigationMeasurement): boolean {
  if (navigation.softLcpMs === null) return true
  const paintedBeforeData = navigation.softLcpMs + READY_FRAME_MS < navigation.clickToReadyMs
  const landedOnChrome =
    navigation.lcpElementKind === 'other' && navigation.lcpElement !== DETACHED_ELEMENT
  return paintedBeforeData || landedOnChrome
}

export function softNavigationSamples(
  navigations: SoftNavigationMeasurement[],
  label: string,
  metric: SoftNavigationMetric,
): number[] {
  return navigations
    .filter((navigation) => navigation.label === label)
    .flatMap((navigation) => {
      const value = navigation[metric]
      return value === null ? [] : [value]
    })
}
