import {type SanityClient} from '@sanity/client'
import {firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getApiNetworkDiagnostic, isUsingLegacyHttp} from './isUsingLegacyHttp'

describe('isUsingLegacyHttp', () => {
  let originalPerformanceObserver: typeof PerformanceObserver
  let originalPerformanceResourceTiming: typeof PerformanceResourceTiming

  beforeEach(() => {
    originalPerformanceObserver = globalThis.PerformanceObserver
    originalPerformanceResourceTiming = globalThis.PerformanceResourceTiming
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    globalThis.PerformanceObserver = originalPerformanceObserver
    globalThis.PerformanceResourceTiming = originalPerformanceResourceTiming
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('request handling', () => {
    it('reuses one legacy protocol probe across callers and subscriptions', async () => {
      const mockEntry = {
        connectEnd: 0,
        connectStart: 0,
        decodedBodySize: 0,
        domainLookupEnd: 0,
        domainLookupStart: 0,
        duration: 1,
        encodedBodySize: 0,
        initiatorType: 'fetch',
        name: 'https://test.api.sanity.io/v2025-02-19/ping?tag=sanity.studio.protocol-check',
        nextHopProtocol: 'h2',
        redirectEnd: 0,
        redirectStart: 0,
        requestStart: 0,
        responseEnd: 0,
        responseStart: 0,
        secureConnectionStart: 0,
        serverTiming: [],
        startTime: performance.now() + 60_000,
        transferSize: 0,
      }

      vi.mocked(fetch).mockResolvedValue(new Response('pong'))
      vi.stubGlobal(
        'PerformanceObserver',
        class {
          callback: (list: {getEntries: () => unknown[]}) => void
          constructor(callback: (list: {getEntries: () => unknown[]}) => void) {
            this.callback = callback
          }
          observe() {
            setTimeout(() => this.callback({getEntries: () => [mockEntry]}), 0)
          }
          disconnect() {
            // noop
          }
        },
      )
      // oxlint-disable-next-line typescript/no-extraneous-class
      const FakePerformanceResourceTiming = class FakePerformanceResourceTiming {}
      vi.stubGlobal('PerformanceResourceTiming', FakePerformanceResourceTiming)
      Object.setPrototypeOf(mockEntry, FakePerformanceResourceTiming.prototype)

      const client = {
        getUrl: (path: string) => `https://test.api.sanity.io/v2025-02-19${path}`,
      } as unknown as SanityClient
      const firstCaller = isUsingLegacyHttp(client)
      const secondCaller = isUsingLegacyHttp(client)

      await expect(
        Promise.all([
          firstValueFrom(firstCaller),
          firstValueFrom(firstCaller),
          firstValueFrom(secondCaller),
        ]),
      ).resolves.toEqual([false, false, false])
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('consumes the response body without showing a cancelled request', async () => {
      // Track whether the response body was consumed or cancelled.
      // An unconsumed fetch() body keeps the underlying HTTP stream alive,
      // which can cause head-of-line blocking on multiplexed connections (H2/H3).
      const bodyCancel = vi.fn(() => Promise.resolve())
      const bodyText = vi.fn(() => Promise.resolve(''))
      const bodyJson = vi.fn(() => Promise.resolve({}))
      const bodyArrayBuffer = vi.fn(() => Promise.resolve(new ArrayBuffer(0)))

      const mockBody = {
        cancel: bodyCancel,
        getReader: vi.fn(),
        locked: false,
        pipeTo: vi.fn(),
        pipeThrough: vi.fn(),
        tee: vi.fn(),
      } as unknown as ReadableStream

      const mockResponse = new Response('pong', {status: 200})
      // Replace the body with our spy-able version
      Object.defineProperty(mockResponse, 'body', {value: mockBody})
      Object.defineProperty(mockResponse, 'text', {value: bodyText})
      Object.defineProperty(mockResponse, 'json', {value: bodyJson})
      Object.defineProperty(mockResponse, 'arrayBuffer', {
        value: bodyArrayBuffer,
      })

      vi.mocked(fetch).mockResolvedValue(mockResponse)

      // Mock PerformanceObserver to emit a timing entry so the observable completes
      const mockEntry = {
        connectEnd: 25,
        connectStart: 15,
        decodedBodySize: 4,
        domainLookupEnd: 15,
        domainLookupStart: 10,
        duration: 35,
        encodedBodySize: 4,
        initiatorType: 'fetch',
        name: 'https://test.api.sanity.io/v2025-02-19/ping?tag=sanity.studio.protocol-check',
        nextHopProtocol: 'h3',
        redirectEnd: 0,
        redirectStart: 0,
        requestStart: 25,
        responseEnd: 45,
        responseStart: 40,
        secureConnectionStart: 20,
        serverTiming: [],
        startTime: performance.now() + 60_000,
        transferSize: 304,
      }
      const mockObserve = vi.fn()
      const mockDisconnect = vi.fn()

      vi.stubGlobal(
        'PerformanceObserver',
        class {
          callback: (list: {getEntries: () => unknown[]}) => void
          constructor(callback: (list: {getEntries: () => unknown[]}) => void) {
            this.callback = callback
          }
          observe() {
            mockObserve()
            // Emit the entry async so the fetch can resolve first
            setTimeout(() => {
              this.callback({getEntries: () => [mockEntry]})
            }, 0)
          }
          disconnect() {
            mockDisconnect()
          }
        },
      )
      // oxlint-disable-next-line typescript/no-extraneous-class
      const FakePerformanceResourceTiming = class FakePerformanceResourceTiming {}
      vi.stubGlobal('PerformanceResourceTiming', FakePerformanceResourceTiming)

      // Make mockEntry pass the instanceof check
      Object.setPrototypeOf(mockEntry, FakePerformanceResourceTiming.prototype)

      const client = {
        getUrl: (path: string) => `https://test.api.sanity.io/v2025-02-19${path}`,
      } as unknown as SanityClient

      const result = await firstValueFrom(getApiNetworkDiagnostic(client))

      expect(result).toMatchObject({
        protocol: 'h3',
        responseOk: true,
        responseStatus: 200,
        status: 'success',
        timedOut: false,
      })
      expect(result.resourceTiming).toMatchObject({
        connectionMs: 10,
        dnsMs: 5,
        encodedBodySizeBytes: 4,
        requestToFirstByteMs: 15,
        responseTransferMs: 5,
        secureConnectionMs: 5,
        transferSizeBytes: 304,
      })

      expect(bodyArrayBuffer).toHaveBeenCalledOnce()
      expect(bodyCancel).not.toHaveBeenCalled()
      expect(bodyText).not.toHaveBeenCalled()
      expect(bodyJson).not.toHaveBeenCalled()
    })

    it('keeps the legacy HTTP check mapped to the detailed probe', async () => {
      const mockEntry = {
        connectEnd: 0,
        connectStart: 0,
        decodedBodySize: 0,
        domainLookupEnd: 0,
        domainLookupStart: 0,
        duration: 1,
        encodedBodySize: 0,
        initiatorType: 'fetch',
        name: 'https://test.api.sanity.io/v2025-02-19/ping?tag=sanity.studio.protocol-check',
        nextHopProtocol: 'http/1.1',
        redirectEnd: 0,
        redirectStart: 0,
        requestStart: 0,
        responseEnd: 0,
        responseStart: 0,
        secureConnectionStart: 0,
        serverTiming: [],
        startTime: performance.now() + 60_000,
        transferSize: 0,
      }

      vi.mocked(fetch).mockResolvedValue(new Response('pong'))
      vi.stubGlobal(
        'PerformanceObserver',
        class {
          callback: (list: {getEntries: () => unknown[]}) => void
          constructor(callback: (list: {getEntries: () => unknown[]}) => void) {
            this.callback = callback
          }
          observe() {
            setTimeout(() => this.callback({getEntries: () => [mockEntry]}), 0)
          }
          disconnect() {
            // noop
          }
        },
      )
      // oxlint-disable-next-line typescript/no-extraneous-class
      const FakePerformanceResourceTiming = class FakePerformanceResourceTiming {}
      vi.stubGlobal('PerformanceResourceTiming', FakePerformanceResourceTiming)
      Object.setPrototypeOf(mockEntry, FakePerformanceResourceTiming.prototype)

      const client = {
        getUrl: (path: string) => `https://test.api.sanity.io/v2025-02-19${path}`,
      } as unknown as SanityClient

      await expect(firstValueFrom(isUsingLegacyHttp(client))).resolves.toBe(true)
    })
  })

  describe('error handling', () => {
    it('emits undefined instead of erroring when the probe request fails', async () => {
      // Silence (and assert) the expected warning from the error path.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // e.g. the browser is offline or the request is blocked
      vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

      // PerformanceObserver that never reports any entries
      vi.stubGlobal(
        'PerformanceObserver',
        class {
          observe() {
            // never emits
          }
          disconnect() {
            // noop
          }
        },
      )
      // oxlint-disable-next-line typescript/no-extraneous-class
      vi.stubGlobal('PerformanceResourceTiming', class FakePerformanceResourceTiming {})

      const client = {
        getUrl: (path: string) => `https://test.api.sanity.io/v2025-02-19${path}`,
      } as unknown as SanityClient

      await expect(firstValueFrom(isUsingLegacyHttp(client))).resolves.toBeUndefined()
      expect(warnSpy).toHaveBeenCalled()
    })

    it('reports when the probe times out', async () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => undefined))
      vi.stubGlobal(
        'PerformanceObserver',
        class {
          observe() {
            // never emits
          }
          disconnect() {
            // noop
          }
        },
      )
      // oxlint-disable-next-line typescript/no-extraneous-class
      vi.stubGlobal('PerformanceResourceTiming', class FakePerformanceResourceTiming {})

      const client = {
        getUrl: (path: string) => `https://test.api.sanity.io/v2025-02-19${path}`,
      } as unknown as SanityClient

      await expect(
        firstValueFrom(getApiNetworkDiagnostic(client, {timeout: 5})),
      ).resolves.toMatchObject({
        protocol: 'unknown',
        status: 'timeout',
        timedOut: true,
      })
    })

    it('reports unsupported browser timing APIs without making a request', async () => {
      vi.stubGlobal('PerformanceObserver', undefined)
      vi.stubGlobal('PerformanceResourceTiming', undefined)

      const client = {} as SanityClient
      await expect(firstValueFrom(getApiNetworkDiagnostic(client))).resolves.toEqual({
        durationMs: 0,
        protocol: 'unknown',
        status: 'unsupported',
        timedOut: false,
      })
      expect(fetch).not.toHaveBeenCalled()
    })
  })
})
