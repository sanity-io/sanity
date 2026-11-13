import {describe, expect, it} from 'vitest'

import {glyphScale, unionBoxes} from './fitGlyph'

describe('unionBoxes', () => {
  it('returns the box around every box', () => {
    expect(
      unionBoxes([
        {left: 2, top: 4, right: 6, bottom: 8},
        {left: 1, top: 5, right: 9, bottom: 7},
      ]),
    ).toEqual({left: 1, top: 4, right: 9, bottom: 8})
  })

  it('returns undefined for no boxes', () => {
    expect(unionBoxes([])).toBeUndefined()
  })
})

describe('glyphScale', () => {
  it('scales a glyph to the target size', () => {
    // A release dot paints 5.2px of its 21px box, a clock 14.4px
    expect(glyphScale(5.2, 10)).toBeCloseTo(1.923, 3)
    expect(glyphScale(14.4, 10)).toBeCloseTo(0.694, 3)
  })

  it('leaves a glyph that paints nothing alone', () => {
    expect(glyphScale(0, 10)).toBeUndefined()
    expect(glyphScale(Number.NaN, 10)).toBeUndefined()
  })
})
