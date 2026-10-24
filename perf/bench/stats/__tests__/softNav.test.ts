import {describe, expect, it} from 'vitest'

import {
  type EventTimingSample,
  type InteractionContentfulPaintSample,
  type LayoutShiftSample,
  type MeasureSample,
  type SoftNavigationSample,
} from '../../instrumentation/types'
import {navigateMeasureName} from '../../runner/session/steps'
import {measureSoftNavigations} from '../softNav'

const softNavigation = (
  navigationId: number,
  interactionId: number,
  startTime: number,
  duration = 100,
): SoftNavigationSample => ({
  url: `https://localhost:3411/softNav/structure/post;post-${navigationId}`,
  navigationType: 'push',
  navigationId,
  interactionId,
  startTime,
  duration,
})

const navigateMeasure = (label: string, startTime: number, duration = 400): MeasureSample => ({
  name: navigateMeasureName(label),
  startTime,
  duration,
})

const clickEvent = (
  navigationId: number,
  interactionId: number,
  duration: number,
): EventTimingSample => ({
  name: 'click',
  interactionId,
  startTime: 0,
  processingStart: 0,
  processingEnd: 0,
  duration,
  navigationId,
})

const paint = (
  interactionId: number,
  startTime: number,
  duration: number,
  size: number,
  element = 'h1 in [data-testid="document-panel-document-title"]',
  elementKind: InteractionContentfulPaintSample['elementKind'] = 'title',
): InteractionContentfulPaintSample => ({
  interactionId,
  navigationId: 0,
  startTime,
  duration,
  size,
  element,
  elementKind,
})

const shift = (
  navigationId: number,
  startTime: number,
  value: number,
  hadRecentInput = false,
): LayoutShiftSample => ({startTime, value, hadRecentInput, sources: [], navigationId})

const emptyEntries = {
  events: [] as EventTimingSample[],
  layoutShifts: [] as LayoutShiftSample[],
  interactionContentfulPaints: [] as InteractionContentfulPaintSample[],
}

describe('measureSoftNavigations', () => {
  it('labels each soft navigation with the navigate step whose click started it', () => {
    const {navigations, undrivenUrls} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('document-open', 1000.4, 420)],
      softNavigations: [softNavigation(2, 50, 1000, 180)],
    })
    expect(undrivenUrls).toEqual([])
    expect(navigations).toEqual([
      expect.objectContaining({
        label: 'document-open',
        softFcpMs: 180,
        clickToReadyMs: 420,
      }),
    ])
  })

  it('reports soft navigations that no navigate step drove', () => {
    const {undrivenUrls} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('pane-open', 1000)],
      softNavigations: [softNavigation(2, 50, 1000), softNavigation(3, 51, 5000)],
    })
    expect(undrivenUrls).toEqual([softNavigation(3, 51, 5000).url])
  })

  it('takes soft LCP from the largest paint of the navigating interaction, across drains', () => {
    const {navigations} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('document-open', 1000)],
      softNavigations: [softNavigation(2, 50, 1000)],
      interactionContentfulPaints: [
        paint(50, 1000, 120, 800, 'div in [data-testid="pane-header"]', 'other'),
        paint(51, 3000, 40, 90_000),
        paint(50, 1000, 310, 6200),
        paint(50, 1000, 200, 5000),
      ],
    })
    expect(navigations[0].softLcpMs).toBe(310)
    expect(navigations[0].lcpElement).toBe('h1 in [data-testid="document-panel-document-title"]')
    expect(navigations[0].lcpElementKind).toBe('title')
  })

  it('leaves soft LCP empty when the navigating interaction painted nothing credited to it', () => {
    const {navigations} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('document-open', 1000)],
      softNavigations: [softNavigation(2, 50, 1000)],
    })
    expect(navigations[0].softLcpMs).toBeNull()
    expect(navigations[0].lcpElement).toBeNull()
  })

  it('credits the click that starts a soft navigation to that navigation, not the previous one', () => {
    const {navigations} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('pane-open', 1000), navigateMeasure('document-open', 2000)],
      softNavigations: [softNavigation(2, 50, 1000), softNavigation(3, 60, 2000)],
      events: [
        // Both navigating clicks carry the navigationId that was current when they fired
        clickEvent(1, 50, 96),
        clickEvent(2, 60, 240),
        clickEvent(2, 55, 64),
        clickEvent(3, 61, 48),
      ],
    })
    expect(navigations.map((navigation) => navigation.softInpMs)).toEqual([96, 240])
  })

  it('takes the worst latency across the events of one interaction', () => {
    const {navigations} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('document-open', 1000)],
      softNavigations: [softNavigation(2, 50, 1000)],
      events: [clickEvent(1, 50, 80), {...clickEvent(1, 50, 112), name: 'pointerup'}],
    })
    expect(navigations[0].softInpMs).toBe(112)
  })

  it('leaves soft INP empty when no interaction of the navigation was observable', () => {
    const {navigations} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('document-open', 1000)],
      softNavigations: [softNavigation(2, 50, 1000)],
    })
    expect(navigations[0].softInpMs).toBeNull()
  })

  it('scores soft CLS as the worst session window of shifts without recent input', () => {
    const {navigations} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('pane-open', 1000), navigateMeasure('document-open', 9000)],
      softNavigations: [softNavigation(2, 50, 1000), softNavigation(3, 60, 9000)],
      layoutShifts: [
        shift(2, 1100, 0.5, true),
        shift(2, 2000, 0.01),
        shift(2, 2500, 0.02),
        // More than 1s after the previous shift: a new window
        shift(2, 4000, 0.025),
        shift(3, 9500, 0.2),
      ],
    })
    expect(navigations[0].softClsScore).toBeCloseTo(0.03)
    expect(navigations[1].softClsScore).toBeCloseTo(0.2)
  })

  it('caps a session window at five seconds', () => {
    const {navigations} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('pane-open', 0)],
      softNavigations: [softNavigation(2, 50, 0)],
      layoutShifts: [0, 900, 1800, 2700, 3600, 4500, 5400].map((startTime) =>
        shift(2, startTime, 0.01),
      ),
    })
    expect(navigations[0].softClsScore).toBeCloseTo(0.06)
  })
})
