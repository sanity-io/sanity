import {firstValueFrom, NEVER, timeout} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type VariantConditionsContext} from '../../../config/types'
import {getStaticConditionsLoadInfo, trackConditionsLoad} from '../trackConditionsLoad'

type ResourceEntry = Pick<
  PerformanceResourceTiming,
  'entryType' | 'name' | 'startTime' | 'initiatorType'
>

/** Stands in for the browser's observer: the test delivers entries, or leaves them queued */
class FakePerformanceObserver {
  static instances: FakePerformanceObserver[] = []
  callback: (list: {getEntries: () => ResourceEntry[]}) => void
  queued: ResourceEntry[] = []
  disconnected = false

  constructor(callback: (list: {getEntries: () => ResourceEntry[]}) => void) {
    this.callback = callback
    FakePerformanceObserver.instances.push(this)
  }

  observe() {}

  takeRecords() {
    const records = this.queued
    this.queued = []
    return records
  }

  disconnect() {
    this.disconnected = true
  }

  deliver(entries: ResourceEntry[]) {
    this.callback({getEntries: () => entries})
  }
}

function request(
  url: string,
  {initiatorType = 'fetch', startTime = performance.now() + 1} = {},
): ResourceEntry {
  return {entryType: 'resource', name: url, startTime, initiatorType}
}

const getClient = vi.fn<VariantConditionsContext['getClient']>()
const context: VariantConditionsContext = {
  projectId: 'project',
  dataset: 'dataset',
  getClient,
  type: 'variant',
}
const definitions = [
  {name: 'audience', title: 'Audience', values: [{value: 'loyal', title: 'Loyal'}]},
  {
    name: 'locale',
    title: 'Locale',
    values: [
      {value: 'en-US', title: 'en-US'},
      {value: 'nb-NO', title: 'nb-NO'},
    ],
  },
]

describe('trackConditionsLoad', () => {
  beforeEach(() => {
    FakePerformanceObserver.instances = []
    vi.stubGlobal('PerformanceObserver', FakePerformanceObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports the hostnames requested while the callback runs, apart from the studio its own', () => {
    const load = trackConditionsLoad(context)
    const [observer] = FakePerformanceObserver.instances

    observer!.deliver([
      request('https://cdp.example.com/v1/audiences?key=secret'),
      request('https://cdp.example.com/v1/locales'),
      request('https://api.vendor.example/segments', {initiatorType: 'xmlhttprequest'}),
      request('https://abc123.api.sanity.io/v2025-02-19/data/query/production'),
      request('https://o1.ingest.sentry.io/api/1/envelope/'),
      request(`${location.origin}/static/manifest.json`),
      request('https://fonts.example.com/font.woff2', {initiatorType: 'css'}),
      request('https://early.example.com/before', {startTime: 0}),
    ])
    observer!.queued = [request('https://late.example.com/last')]

    const info = load.finish(definitions)

    expect(info.endpoints).toEqual(['api.vendor.example', 'cdp.example.com', 'late.example.com'])
    expect(observer!.disconnected).toBe(true)
  })

  it('describes the load and whether the callback used the Sanity client', () => {
    const load = trackConditionsLoad(context)
    load.setAsync(true)

    expect(load.context).toMatchObject({projectId: 'project', dataset: 'dataset', type: 'variant'})
    load.context.getClient({apiVersion: '2025-02-19'})
    expect(getClient).toHaveBeenCalledWith({apiVersion: '2025-02-19'})

    expect(load.finish(definitions)).toEqual({
      source: 'function',
      async: true,
      outcome: 'ready',
      durationMs: expect.any(Number),
      conditionCount: 2,
      valueCount: 3,
      usedSanityClient: true,
      endpoints: [],
    })
  })

  it('tells a timeout apart from other failures', async () => {
    const timeoutError: unknown = await firstValueFrom(NEVER.pipe(timeout({first: 1}))).catch(
      (error: unknown) => error,
    )

    expect(trackConditionsLoad(context).finish(undefined, timeoutError)).toMatchObject({
      outcome: 'timeout',
      conditionCount: 0,
      valueCount: 0,
    })
    expect(trackConditionsLoad(context).finish(undefined, new Error('down'))).toMatchObject({
      outcome: 'error',
    })
  })

  it('stops watching requests when the load is abandoned', () => {
    const load = trackConditionsLoad(context)
    const [observer] = FakePerformanceObserver.instances

    load.stop()

    expect(observer!.disconnected).toBe(true)
  })

  it('reports no endpoints where the browser has no performance observer', () => {
    vi.stubGlobal('PerformanceObserver', undefined)

    expect(trackConditionsLoad(context).finish(definitions).endpoints).toEqual([])
  })
})

describe('getStaticConditionsLoadInfo', () => {
  it('describes a fixed list from the config', () => {
    expect(getStaticConditionsLoadInfo(definitions)).toEqual({
      source: 'static',
      async: false,
      outcome: 'ready',
      durationMs: 0,
      conditionCount: 2,
      valueCount: 3,
      usedSanityClient: false,
      endpoints: [],
    })
    expect(getStaticConditionsLoadInfo(undefined)).toMatchObject({
      outcome: 'error',
      conditionCount: 0,
    })
  })
})
