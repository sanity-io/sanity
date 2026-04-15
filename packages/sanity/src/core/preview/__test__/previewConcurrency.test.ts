import {type SanityClient} from '@sanity/client'
import {Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createDocumentPreviewStore, MAX_PREVIEW_FETCH_CONCURRENCY} from '../documentPreviewStore'

describe('preview fetch concurrency cap', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should export a reasonable concurrency limit', () => {
    expect(MAX_PREVIEW_FETCH_CONCURRENCY).toBeGreaterThan(0)
    expect(MAX_PREVIEW_FETCH_CONCURRENCY).toBeLessThanOrEqual(10)
  })

  it('should cap concurrent preview fetches through createDocumentPreviewStore', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const listenSubject = new Subject()

    const mockClient = {
      withConfig: vi.fn(),
      listen: vi.fn(() => listenSubject.asObservable()),
      observable: {
        fetch: vi.fn(() => {
          inFlight++
          maxInFlight = Math.max(maxInFlight, inFlight)
          // Never resolve — simulates slow responses to keep slots occupied
          return new Subject().asObservable()
        }),
      },
    } as unknown as SanityClient
    ;(mockClient.withConfig as ReturnType<typeof vi.fn>).mockReturnValue(mockClient)

    const store = createDocumentPreviewStore({client: mockClient})

    // Each document gets a unique field so combineSelections produces separate
    // selections → separate chunks → separate fetchChunk calls → separate
    // client.observable.fetch calls gated by the concurrency limiter.
    const docCount = MAX_PREVIEW_FETCH_CONCURRENCY * 3
    const subs = Array.from({length: docCount}, (_, i) =>
      store.observePaths({_type: 'reference', _ref: `doc-${i}`}, [`unique_field_${i}`]).subscribe(),
    )

    // Emit welcome to trigger initial fetch for all observers
    listenSubject.next({type: 'welcome'})
    await vi.advanceTimersByTimeAsync(200)

    expect(maxInFlight).toBeGreaterThan(0)
    expect(maxInFlight).toBeLessThanOrEqual(MAX_PREVIEW_FETCH_CONCURRENCY)

    subs.forEach((sub) => sub.unsubscribe())
  })
})
