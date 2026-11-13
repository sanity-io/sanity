import {describe, expect, it} from 'vitest'

import {
  STATUS_MARK_SIZES,
  STATUS_MARKS,
  type StatusMarkName,
  type StatusMarkSize,
  statusMarkGeometry,
} from './statusMarkGeometry'

const MARKS = Object.keys(STATUS_MARKS) as StatusMarkName[]
const SIZES = Object.keys(STATUS_MARK_SIZES) as StatusMarkSize[]

/** The size table: the painted size of every mark at every size, in px. */
const TABLE: Record<StatusMarkName, [row: number, list: number, inline: number]> = {
  'published': [8, 7.2, 6.4],
  'undecided': [8, 7.2, 6.4],
  'draft': [8, 7.2, 6.4],
  'asap': [10, 9, 8],
  'scheduled': [10, 9, 8],
  'agent': [10, 9, 8],
  'variant': [10, 9, 8],
  'variant-empty': [10, 9, 8],
}

describe('statusMarkGeometry', () => {
  it('uses M = 10px in rows, 9px in list slots and 8px inline', () => {
    expect(STATUS_MARK_SIZES).toEqual({row: 10, list: 9, inline: 8})
  })

  it.each(MARKS)('paints %s at M × its share at every size', (mark) => {
    expect(SIZES.map((size) => statusMarkGeometry(mark, size).painted)).toEqual(TABLE[mark])
  })

  it.each(MARKS)('draws %s in a box of whole pixels with a 1px margin', (mark) => {
    for (const size of SIZES) {
      const {box, painted} = statusMarkGeometry(mark, size)
      expect(Number.isInteger(box)).toBe(true)
      expect(box).toBe(Math.ceil(painted) + 2)
    }
  })

  it.each(MARKS)('crops the viewBox of %s so the drawing paints its size, centred', (mark) => {
    const {extent, stroke} = STATUS_MARKS[mark]
    for (const size of SIZES) {
      const {box, painted, viewBox} = statusMarkGeometry(mark, size)
      const [x, y, width, height] = viewBox.split(' ').map(Number)
      expect(width).toBe(height)
      expect(x + width / 2).toBeCloseTo(12.5, 3)
      expect(y + height / 2).toBeCloseTo(12.5, 3)
      // The geometry at the box's scale, plus the stroke, which does not scale
      expect((extent * box) / width + stroke).toBeCloseTo(painted, 2)
    }
  })

  it('gives the shapes their tones', () => {
    expect(Object.fromEntries(MARKS.map((mark) => [mark, STATUS_MARKS[mark].tone]))).toEqual({
      'published': 'positive',
      'undecided': 'neutral',
      'draft': 'caution',
      'asap': 'caution',
      'scheduled': 'suggest',
      'agent': 'suggest',
      'variant': 'suggest',
      'variant-empty': 'suggest',
    })
  })
})
