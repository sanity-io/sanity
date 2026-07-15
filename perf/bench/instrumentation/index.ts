/**
 * The in-page collector. Bundled to an IIFE by the runner at startup
 * (runner/inject.ts) and injected via `page.addInitScript` — so it runs
 * before any studio code on every navigation. All timing happens on the
 * page's own monotonic clock; the runner never compares cross-process
 * timestamps (the core design fix over the old eFPS suite).
 */
import {
  type BenchCollector,
  type BenchEntries,
  type EventTimingSample,
  type LayoutShiftSample,
  type LoafSample,
  type MeasureSample,
  type PaintSample,
  type ResourceSample,
} from './types'

/**
 * The spec minimum. Interactions faster than 16ms are unobservable — which
 * is why interaction sessions run under CPU throttling (see constants.ts
 * CPU_THROTTLE_RATE and the README).
 */
const EVENT_DURATION_THRESHOLD = 16

function install(): void {
  const events: EventTimingSample[] = []
  const loafs: LoafSample[] = []
  const paints: PaintSample[] = []
  const layoutShifts: LayoutShiftSample[] = []
  const measures: MeasureSample[] = []
  const resources: ResourceSample[] = []
  let largestContentfulPaint: PaintSample | null = null

  function observe(
    type: string,
    callback: (entries: PerformanceEntry[]) => void,
    options: PerformanceObserverInit = {},
  ): void {
    try {
      const observer = new PerformanceObserver((list) => callback(list.getEntries()))
      observer.observe({type, buffered: true, ...options})
    } catch {
      // Entry type unsupported in this browser — the runner validates that
      // the entries it depends on actually arrived.
    }
  }

  observe(
    'event',
    (entries) => {
      for (const entry of entries) {
        const event = entry as PerformanceEventTiming
        events.push({
          name: event.name,
          interactionId: event.interactionId ?? 0,
          startTime: event.startTime,
          processingStart: event.processingStart,
          processingEnd: event.processingEnd,
          duration: event.duration,
        })
      }
    },
    {durationThreshold: EVENT_DURATION_THRESHOLD} as PerformanceObserverInit,
  )

  observe('long-animation-frame', (entries) => {
    for (const entry of entries) {
      const loaf = entry as PerformanceEntry & {
        blockingDuration: number
        scripts?: {sourceURL: string; invoker: string; duration: number}[]
      }
      loafs.push({
        startTime: loaf.startTime,
        duration: loaf.duration,
        blockingDuration: loaf.blockingDuration,
        scripts: (loaf.scripts ?? []).map((script) => ({
          sourceUrl: script.sourceURL,
          functionName: script.invoker,
          duration: script.duration,
        })),
      })
    }
  })

  observe('paint', (entries) => {
    for (const entry of entries) {
      paints.push({name: entry.name, startTime: entry.startTime})
    }
  })

  observe('largest-contentful-paint', (entries) => {
    const last = entries.at(-1)
    if (last) {
      largestContentfulPaint = {name: 'largest-contentful-paint', startTime: last.startTime}
    }
  })

  observe('layout-shift', (entries) => {
    for (const entry of entries) {
      const shift = entry as PerformanceEntry & {value: number; hadRecentInput: boolean}
      layoutShifts.push({
        startTime: shift.startTime,
        value: shift.value,
        hadRecentInput: shift.hadRecentInput,
      })
    }
  })

  observe('measure', (entries) => {
    for (const entry of entries) {
      if (entry.name.startsWith('bench:')) {
        measures.push({name: entry.name, startTime: entry.startTime, duration: entry.duration})
      }
    }
  })

  observe('resource', (entries) => {
    for (const entry of entries) {
      const resource = entry as PerformanceResourceTiming
      resources.push({
        url: resource.name,
        startTime: resource.startTime,
        responseEnd: resource.responseEnd,
      })
    }
  })

  const collector: BenchCollector = {
    version: 1,
    take(): BenchEntries {
      const navigation = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined
      const taken: BenchEntries = {
        events: events.splice(0),
        loafs: loafs.splice(0),
        paints: paints.splice(0),
        largestContentfulPaint,
        layoutShifts: layoutShifts.splice(0),
        navigation: navigation
          ? {
              responseStart: navigation.responseStart,
              domContentLoadedEventEnd: navigation.domContentLoadedEventEnd,
              loadEventEnd: navigation.loadEventEnd,
            }
          : null,
        measures: measures.splice(0),
        resources: resources.splice(0),
      }
      return taken
    },
  }

  window.__bench = collector
}

install()
