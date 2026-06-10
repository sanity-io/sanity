import {type SanityClient} from '@sanity/client'
import {firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {isUsingLegacyHttp} from './isUsingLegacyHttp'

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
    vi.restoreAllMocks()
  })

  describe('response body consumption', () => {
    it('should consume or cancel the response body to avoid holding the HTTP stream open', async () => {
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
        name: 'https://test.api.sanity.io/v2025-02-19/ping?tag=sanity.studio.protocol-check',
        nextHopProtocol: 'h3',
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

      const result = await firstValueFrom(isUsingLegacyHttp(client))

      // The protocol was detected
      expect(result).toBe(false) // h3 is not legacy

      // The critical assertion: the response body must have been consumed or cancelled.
      // Any one of these methods being called is sufficient — it means the stream was freed.
      const bodyWasConsumed =
        bodyCancel.mock.calls.length > 0 ||
        bodyText.mock.calls.length > 0 ||
        bodyJson.mock.calls.length > 0 ||
        bodyArrayBuffer.mock.calls.length > 0

      expect(bodyWasConsumed).toBe(true)
    })
  })
})
