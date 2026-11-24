import {describe, expect, it} from 'vitest'

import {getScrollThumbGeometry} from './useOverlayScrollThumb'

describe('getScrollThumbGeometry', () => {
  it('has no thumb when nothing overflows', () => {
    expect(
      getScrollThumbGeometry({scrollLeft: 0, scrollWidth: 800, clientWidth: 800, trackWidth: 764}),
    ).toBeNull()
  })

  it('sizes the thumb by the visible share of the content, along the track', () => {
    expect(
      getScrollThumbGeometry({
        scrollLeft: 0,
        scrollWidth: 2000,
        clientWidth: 1000,
        trackWidth: 964,
      }),
    ).toEqual({width: 482, offset: 0})
  })

  it('ends at the end of the track when scrolled to the end, clear of the pinned button', () => {
    expect(
      getScrollThumbGeometry({
        scrollLeft: 1000,
        scrollWidth: 2000,
        clientWidth: 1000,
        trackWidth: 964,
      }),
    ).toEqual({width: 482, offset: 482})
  })

  it('keeps a minimum width for very long strips', () => {
    const geometry = getScrollThumbGeometry({
      scrollLeft: 49_500,
      scrollWidth: 100_000,
      clientWidth: 1000,
      trackWidth: 964,
    })
    expect(geometry?.width).toBe(24)
    expect(geometry?.offset).toBeCloseTo(470)
  })
})
