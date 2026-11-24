import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  COLLAPSED_RAIL_WIDTH,
  estimateVisionLayoutWidths,
  getVisionLayout,
  MOBILE_BREAKPOINT,
  STACKED_BREAKPOINT,
} from './visionLayout'

/** The widths of a tool whose rail is collapsed and has no drawer open */
const collapsed = (tool: number) => ({tool, tabs: tool - COLLAPSED_RAIL_WIDTH})

describe('getVisionLayout', () => {
  it('stacks below a 900px tool and goes to the phone layout below 600px with the rail collapsed', () => {
    expect(getVisionLayout(collapsed(1400))).toBe('columns')
    expect(getVisionLayout(collapsed(900))).toBe('columns')
    expect(getVisionLayout(collapsed(899))).toBe('stacked')
    expect(getVisionLayout(collapsed(600))).toBe('stacked')
    expect(getVisionLayout(collapsed(599))).toBe('mobile')
  })

  it('stacks the columns when the sidebar takes their room, as a narrower window would', () => {
    // An expanded rail (224px) and an open drawer (300px) in a window wide enough for columns
    expect(getVisionLayout({tool: 1200, tabs: 1200 - 224})).toBe('columns')
    expect(getVisionLayout({tool: 1000, tabs: 1000 - 224})).toBe('stacked')
    expect(getVisionLayout({tool: 1100, tabs: 1100 - COLLAPSED_RAIL_WIDTH - 300})).toBe('stacked')
    expect(getVisionLayout({tool: 1300, tabs: 1300 - COLLAPSED_RAIL_WIDTH - 300})).toBe('columns')
  })

  it('decides the phone layout on the whole tool, whatever the sidebar leaves the tabs', () => {
    expect(getVisionLayout({tool: MOBILE_BREAKPOINT, tabs: 100})).toBe('stacked')
    expect(getVisionLayout({tool: MOBILE_BREAKPOINT - 1, tabs: 2000})).toBe('mobile')
    expect(getVisionLayout({tool: 2000, tabs: STACKED_BREAKPOINT})).toBe('columns')
  })
})

describe('estimateVisionLayoutWidths', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('guesses a tool as wide as the window, with the rail collapsed', () => {
    vi.stubGlobal('innerWidth', 1280)
    expect(estimateVisionLayoutWidths()).toEqual({tool: 1280, tabs: 1280 - COLLAPSED_RAIL_WIDTH})
  })
})
