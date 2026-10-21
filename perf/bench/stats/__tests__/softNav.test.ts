import {describe, expect, it} from 'vitest'

import {
  type EventTimingSample,
  type InteractionContentfulPaintSample,
  type LayoutShiftSample,
  type MeasureSample,
  type PaintedElementKind,
  type SoftNavigationSample,
} from '../../instrumentation/types'
import {
  isMiscreditedDocumentOpen,
  measureSoftNavigations,
  softNavigationMetricLabel,
  softNavigationSamples,
} from '../softNav'

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
  name: `bench:navigate:${label}`,
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
    const {navigations, unexpected} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('document-open', 1000.4, 420)],
      softNavigations: [softNavigation(2, 50, 1000, 180)],
    })
    expect(unexpected).toEqual([])
    expect(navigations).toEqual([
      expect.objectContaining({
        label: 'document-open',
        softFcpMs: 180,
        clickToReadyMs: 420,
      }),
    ])
  })

  it('reports soft navigations that no navigate step drove', () => {
    const {unexpected} = measureSoftNavigations({
      ...emptyEntries,
      measures: [navigateMeasure('pane-open', 1000)],
      softNavigations: [softNavigation(2, 50, 1000), softNavigation(3, 51, 5000)],
    })
    expect(unexpected).toEqual([softNavigation(3, 51, 5000).url])
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

describe('isMiscreditedDocumentOpen', () => {
  const documentOpen = (
    softLcpMs: number | null,
    lcpElement: string | null,
    lcpElementKind: PaintedElementKind | null,
  ) => ({
    label: 'document-open',
    softLcpMs,
    lcpElement,
    lcpElementKind,
    softFcpMs: 100,
    softInpMs: 96,
    softClsScore: 0,
    clickToReadyMs: 300,
  })

  it('accepts a soft LCP on the document title once its data is on screen', () => {
    expect(
      isMiscreditedDocumentOpen(
        documentOpen(310, 'h1 in [data-testid="document-panel-document-title"]', 'title'),
      ),
    ).toBe(false)
  })

  it('accepts an element Studio replaced before Chrome reported it, when it painted after the data', () => {
    expect(isMiscreditedDocumentOpen(documentOpen(312, '(detached)', 'other'))).toBe(false)
  })

  it('rejects a soft LCP that painted before the document data was on screen', () => {
    expect(isMiscreditedDocumentOpen(documentOpen(140, '(detached)', 'other'))).toBe(true)
  })

  it('rejects a soft LCP on pane chrome', () => {
    expect(
      isMiscreditedDocumentOpen(documentOpen(320, 'div in [data-testid="pane-header"]', 'other')),
    ).toBe(true)
  })

  it('rejects a document open with no paint credited to its click', () => {
    expect(isMiscreditedDocumentOpen(documentOpen(null, null, null))).toBe(true)
  })
})

describe('softNavigationSamples', () => {
  const navigation = (label: string, values: Partial<Record<string, number | null>>) => ({
    label,
    softLcpMs: null,
    lcpElement: null,
    lcpElementKind: null,
    softFcpMs: 100,
    softInpMs: null,
    softClsScore: 0,
    clickToReadyMs: 300,
    ...values,
  })
  const navigations = [
    navigation('document-open', {softLcpMs: 250, softInpMs: 96}),
    navigation('tool-switch', {softFcpMs: 80}),
    navigation('document-open', {softLcpMs: 270, softFcpMs: 120}),
  ]

  it('takes one metric of the navigations with one label, in order', () => {
    expect(softNavigationSamples(navigations, 'document-open', 'softLcpMs')).toEqual([250, 270])
    expect(softNavigationSamples(navigations, 'document-open', 'softFcpMs')).toEqual([100, 120])
    expect(softNavigationSamples(navigations, 'tool-switch', 'softFcpMs')).toEqual([80])
  })

  it('skips navigations without a value', () => {
    expect(softNavigationSamples(navigations, 'document-open', 'softInpMs')).toEqual([96])
    expect(softNavigationSamples(navigations, 'tool-switch', 'softLcpMs')).toEqual([])
  })
})

describe('softNavigationMetricLabel', () => {
  it('labels each metric under its navigate step', () => {
    const labels = (
      ['softLcpMs', 'softFcpMs', 'softInpMs', 'softClsScore', 'clickToReadyMs'] as const
    ).map((metric) => softNavigationMetricLabel('document-open', metric))
    expect(labels).toEqual([
      'nav:document-open / soft LCP time',
      'nav:document-open / soft FCP time',
      'nav:document-open / soft INP latency',
      'nav:document-open / soft CLS score',
      'nav:document-open / click to ready',
    ])
  })
})
