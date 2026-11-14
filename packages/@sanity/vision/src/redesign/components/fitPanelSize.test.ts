import {describe, expect, it} from 'vitest'

import {bottomPanelSizeToFit} from './fitPanelSize'

const roomy = {
  headerHeight: 35,
  containerHeight: 600,
  minMainHeight: 120,
  handleSize: 1,
}

describe('bottomPanelSizeToFit', () => {
  it('sizes the panel to its header plus its content', () => {
    expect(bottomPanelSizeToFit({...roomy, contentHeight: 80})).toBe(115)
  })

  it('stops at the room the split leaves the main area', () => {
    expect(
      bottomPanelSizeToFit({
        headerHeight: 35,
        contentHeight: 900,
        containerHeight: 400,
        minMainHeight: 120,
        handleSize: 1,
      }),
    ).toBe(279)
  })

  it('keeps at least the header when the content is empty', () => {
    expect(bottomPanelSizeToFit({...roomy, contentHeight: 0})).toBe(35)
  })

  it('waits while the split is not laid out', () => {
    expect(bottomPanelSizeToFit({...roomy, contentHeight: 80, containerHeight: 0})).toBeNull()
    expect(bottomPanelSizeToFit({...roomy, headerHeight: 0, contentHeight: 80})).toBeNull()
  })
})
