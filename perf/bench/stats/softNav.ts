import {
  type BenchEntries,
  type EventTimingSample,
  type InteractionContentfulPaintSample,
  type LayoutShiftSample,
  type PaintedElementKind,
  type SoftNavigationSample,
} from '../instrumentation/types'
import {NAVIGATE_MEASURE_PREFIX, SOFT_NAVIGATION_MATCH_MS} from '../runner/session/steps'

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

const CLS_WINDOW_GAP_MS = 1000
const CLS_WINDOW_MAX_MS = 5000

/** Takes a whole session's entries: a larger paint of an interaction can land after a later drain. */
export function measureSoftNavigations(
  entries: Pick<
    BenchEntries,
    'measures' | 'softNavigations' | 'events' | 'layoutShifts' | 'interactionContentfulPaints'
  >,
): {navigations: SoftNavigationMeasurement[]; undrivenUrls: string[]} {
  const navigateMeasures = entries.measures.filter((measure) =>
    measure.name.startsWith(NAVIGATE_MEASURE_PREFIX),
  )
  const startedBy = (softNavigation: SoftNavigationSample) =>
    navigateMeasures.find(
      (measure) =>
        Math.abs(measure.startTime - softNavigation.startTime) <= SOFT_NAVIGATION_MATCH_MS,
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
    undrivenUrls: entries.softNavigations
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
