import {describe, expect, it} from 'vitest'

import {
  getMarksFlyoutAnchor,
  getMarksFlyoutSide,
  MARKS_FLYOUT_GAP,
  MARKS_FLYOUT_VIEWPORT_MARGIN,
  MARKS_FLYOUT_WIDTH,
  POPOVER_OFFSET,
} from '../getMarksFlyoutPlacement'

/** A search dialog 800px wide, centred in the viewport. */
function dialog(viewportWidth: number, width = 800) {
  const left = (viewportWidth - width) / 2
  return {left, right: left + width, top: 100, bottom: 700}
}

describe('getMarksFlyoutSide', () => {
  it('opens to the right of the box when the right side has room', () => {
    expect(getMarksFlyoutSide({container: dialog(1800), viewportWidth: 1800})).toBe('right')
  })

  it('opens to the left when only the left side has room', () => {
    const container = {left: 600, right: 1350, top: 0, bottom: 500}
    expect(getMarksFlyoutSide({container, viewportWidth: 1400})).toBe('left')
  })

  it('opens nowhere when neither side has room, as in a narrow viewport', () => {
    expect(getMarksFlyoutSide({container: dialog(1280), viewportWidth: 1280})).toBeNull()
  })

  it('opens nowhere for a box that fills the screen (full-screen search)', () => {
    const container = {left: 0, right: 390, top: 0, bottom: 844}
    expect(getMarksFlyoutSide({container, viewportWidth: 390})).toBeNull()
  })

  it('needs the whole width, the gap and the margin on a side', () => {
    const exact = MARKS_FLYOUT_GAP + MARKS_FLYOUT_WIDTH + MARKS_FLYOUT_VIEWPORT_MARGIN
    const container = {left: 0, right: 1000, top: 0, bottom: 100}
    expect(getMarksFlyoutSide({container, viewportWidth: 1000 + exact})).toBe('right')
    expect(getMarksFlyoutSide({container, viewportWidth: 1000 + exact - 1})).toBeNull()
  })
})

describe('getMarksFlyoutAnchor', () => {
  const container = {left: 500, right: 1300, top: 100, bottom: 700}
  const row = {left: 510, right: 1290, top: 240, bottom: 290}

  it('is a line at the right edge, out by the gap less the Popover offset, at the row', () => {
    const anchor = getMarksFlyoutAnchor({container, row, side: 'right'})
    expect(anchor.left).toBe(1300 + MARKS_FLYOUT_GAP - POPOVER_OFFSET)
    expect(anchor.width).toBe(0)
    expect(anchor.top).toBe(240)
    expect(anchor.height).toBe(50)
  })

  it('is a line at the left edge for the left side', () => {
    const anchor = getMarksFlyoutAnchor({container, row, side: 'left'})
    expect(anchor.right).toBe(500 - MARKS_FLYOUT_GAP + POPOVER_OFFSET)
    expect(anchor.top).toBe(240)
  })
})
