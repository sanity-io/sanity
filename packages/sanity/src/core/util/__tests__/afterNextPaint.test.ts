import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {afterNextPaint} from '../afterNextPaint'

describe('afterNextPaint', () => {
  let frames: FrameRequestCallback[]
  let cancelled: number[]
  let visibilityState: DocumentVisibilityState

  beforeEach(() => {
    frames = []
    cancelled = []
    visibilityState = 'visible'
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback)
      return frames.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((handle) => {
      cancelled.push(handle)
    })
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilityState)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function subscribe() {
    const emissions: string[] = []
    const subscription = afterNextPaint().subscribe({
      next: () => emissions.push('next'),
      complete: () => emissions.push('complete'),
    })
    return {emissions, subscription}
  }

  it('emits in a task after the next frame, so the frame gets painted first', async () => {
    const {emissions} = subscribe()
    expect(frames).toHaveLength(1)
    expect(emissions).toEqual([])

    frames[0](performance.now())
    // the paint happens between the frame callback and the task
    expect(emissions).toEqual([])
    await vi.waitFor(() => expect(emissions).toEqual(['next', 'complete']))
  })

  it('emits right away on a hidden page, which paints nothing', () => {
    visibilityState = 'hidden'
    const {emissions} = subscribe()

    expect(emissions).toEqual(['next', 'complete'])
    expect(frames).toHaveLength(0)
  })

  it('stops waiting for a frame when the page gets hidden', () => {
    const {emissions} = subscribe()
    expect(frames).toHaveLength(1)

    visibilityState = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))

    expect(emissions).toEqual(['next', 'complete'])
    expect(cancelled).toEqual([1])
  })

  it('cancels the frame request when unsubscribed', () => {
    const {emissions, subscription} = subscribe()
    subscription.unsubscribe()

    expect(cancelled).toEqual([1])
    frames[0](performance.now())
    expect(emissions).toEqual([])
  })
})
