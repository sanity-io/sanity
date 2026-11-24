import {describe, expect, it} from 'vitest'

import {bottomPanelSizeToFit, defaultBottomPanelSize} from './fitPanelSize'

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

const layout = {
  rowOffset: 220,
  headerHeight: 35,
  bodyBorder: 1,
  footerHeight: 36,
  minMainHeight: 120,
  handleSize: 1,
}

/** How far above the column's bottom each column's aligned row starts, at its default size */
function alignedRows(columnHeight: number | undefined, metrics = layout) {
  const request = defaultBottomPanelSize({...metrics, column: 'request', columnHeight})
  const response = defaultBottomPanelSize({...metrics, column: 'response', columnHeight})
  return {
    request: metrics.footerHeight + request - metrics.headerHeight - metrics.bodyBorder,
    response,
  }
}

describe('defaultBottomPanelSize', () => {
  it('puts the response tab header at the row offset', () => {
    expect(defaultBottomPanelSize({...layout, column: 'response', columnHeight: 800})).toBe(220)
  })

  it('lines the request toolbar row up with the response tab header', () => {
    for (const columnHeight of [undefined, 300, 377, 500, 800, 1200]) {
      const rows = alignedRows(columnHeight)
      expect(rows.request).toBe(rows.response)
    }
  })

  it('keeps the rows level when the action bar and the header differ', () => {
    const metrics = {...layout, footerHeight: 48, headerHeight: 30, bodyBorder: 2}
    for (const columnHeight of [undefined, 320, 500, 800]) {
      const rows = alignedRows(columnHeight, metrics)
      expect(rows.request).toBe(rows.response)
    }
    expect(defaultBottomPanelSize({...metrics, column: 'request', columnHeight: 800})).toBe(204)
  })

  it('holds both columns to what the request split can give the row', () => {
    // 400 tall: the request split is 364, which leaves its panel 364 - 120 - 1 = 243 at most
    expect(alignedRows(400)).toEqual({request: 220, response: 220})
    // 300 tall: 300 - 36 - 120 - 1 = 143 for the row, in the request split's bounds
    expect(defaultBottomPanelSize({...layout, column: 'request', columnHeight: 300})).toBe(143)
    expect(defaultBottomPanelSize({...layout, column: 'response', columnHeight: 300})).toBe(143)
  })

  it('never goes below the header', () => {
    expect(defaultBottomPanelSize({...layout, column: 'response', columnHeight: 100})).toBe(35)
    expect(defaultBottomPanelSize({...layout, column: 'request', columnHeight: 100})).toBe(35)
  })
})
