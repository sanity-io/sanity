import {type SanityClient} from '@sanity/client'
import {of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type DocumentPreviewStore} from '../../../preview/documentPreviewStore'
import {createReleaseStore} from '../createReleaseStore'

function createMockClient() {
  const listener$ = new Subject<{type: 'welcome' | 'mutation'}>()
  const fetch = vi.fn(() => of([]))
  const listen = vi.fn(() => listener$)
  const client = {
    listen,
    observable: {fetch, listen: vi.fn(() => new Subject())},
  } as unknown as SanityClient

  return {client, fetch, listen, listener$}
}

describe('createReleaseStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the listener through a brief resubscribe and releases it once nobody is left', async () => {
    const {client, listen, listener$} = createMockClient()
    const store = createReleaseStore({client, previewStore: {} as DocumentPreviewStore})

    const first = store.state$.subscribe()
    listener$.next({type: 'welcome'})
    await vi.advanceTimersByTimeAsync(0)
    expect(listener$.observed).toBe(true)

    // A consumer that remounts within the grace period finds the same listener
    first.unsubscribe()
    await vi.advanceTimersByTimeAsync(1000)
    const second = store.state$.subscribe()
    expect(listen).toHaveBeenCalledTimes(1)

    // A workspace that was switched away from has no consumer left, so its
    // `/listen` stream must not outlive the grace period
    second.unsubscribe()
    await vi.advanceTimersByTimeAsync(4999)
    expect(listener$.observed).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    expect(listener$.observed).toBe(false)
  })

  it('does not let an errorCount$ consumer prolong the listener beyond the grace period', async () => {
    const {client, listener$} = createMockClient()
    const store = createReleaseStore({client, previewStore: {} as DocumentPreviewStore})

    const subscription = store.errorCount$.subscribe()
    listener$.next({type: 'welcome'})
    await vi.advanceTimersByTimeAsync(0)
    expect(listener$.observed).toBe(true)

    subscription.unsubscribe()
    await vi.advanceTimersByTimeAsync(5000)
    expect(listener$.observed).toBe(false)
  })
})
