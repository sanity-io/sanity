import {describe, expect, it} from 'vitest'

import {getSplitSnap, snapDragSize, snapKeyboardStep} from './splitSnap'

describe('getSplitSnap', () => {
  it('puts the center where both panes get the same size around the divider', () => {
    expect(getSplitSnap(801, 1, {min: 100, max: 700})?.center).toBe(400)
    // Without an even split, the nearest whole pixel
    expect(getSplitSnap(801.6, 1, {min: 100, max: 700})?.center).toBe(400)
    expect(getSplitSnap(1200, 1, {min: 100, max: 919})?.center).toBe(600)
  })

  it('scales the threshold with the container, between 8 and 12 pixels', () => {
    expect(getSplitSnap(400, 1, {min: 0, max: 400})?.threshold).toBe(8)
    expect(getSplitSnap(700, 1, {min: 0, max: 700})?.threshold).toBeCloseTo(10.5)
    expect(getSplitSnap(2000, 1, {min: 0, max: 2000})?.threshold).toBe(12)
  })

  it('does not snap when equal halves would break a minimum', () => {
    // 501px with 300px minimums: the center (250) is below the primary minimum
    expect(getSplitSnap(501, 1, {min: 300, max: 300})).toBeNull()
    // The center is the bound itself: still allowed
    expect(getSplitSnap(601, 1, {min: 300, max: 300})?.center).toBe(300)
    expect(getSplitSnap(801, 1, {min: 100, max: 399})).toBeNull()
  })
})

describe('snapDragSize', () => {
  const snap = {center: 400, threshold: 10}
  const size = (value: number, engaged = false) => snapDragSize(value, snap, engaged).size

  it('engages within the threshold, on either side and at its edge', () => {
    expect(snapDragSize(400, snap, false)).toEqual({size: 400, engaged: true})
    expect(size(393)).toBe(400)
    expect(size(410)).toBe(400)
    expect(size(390)).toBe(400)
    expect(size(410, true)).toBe(400)
  })

  it('ramps back to the pointer once engaged, without a jump', () => {
    expect(size(411, true)).toBe(402)
    expect(size(415, true)).toBe(410)
    expect(size(389, true)).toBe(398)
    expect(snapDragSize(415, snap, true).engaged).toBe(true)
    // From twice the threshold on, the size is the pointer's again and the drag disengages
    expect(snapDragSize(420, snap, true)).toEqual({size: 420, engaged: false})
    expect(size(380, true)).toBe(380)
    expect(size(600, true)).toBe(600)
  })

  it('follows the pointer when a drag starts within the ramp band without being engaged', () => {
    // Released at 415, or an arrow step from the center: the first move must not jump to 410
    expect(snapDragSize(415, snap, false)).toEqual({size: 415, engaged: false})
    expect(size(416, false)).toBe(416)
    expect(size(419, false)).toBe(419)
    expect(size(389, false)).toBe(389)
  })

  it('stays put while engaged, then moves monotonically with the pointer', () => {
    let engaged = false
    let previous = -Infinity
    for (let value = 360; value <= 440; value++) {
      const drag = snapDragSize(value, snap, engaged)
      engaged = drag.engaged
      expect(drag.size).toBeGreaterThanOrEqual(previous)
      previous = drag.size
    }
  })

  it('leaves the size alone without a snap', () => {
    expect(snapDragSize(405, null, false)).toEqual({size: 405, engaged: false})
  })
})

describe('snapKeyboardStep', () => {
  const snap = {center: 400, threshold: 10}

  it('stops a step that would pass over the center on it', () => {
    expect(snapKeyboardStep(390, 406, snap)).toBe(400)
    expect(snapKeyboardStep(410, 330, snap)).toBe(400)
  })

  it('leaves steps that land on, start at or stay off the center alone', () => {
    expect(snapKeyboardStep(384, 400, snap)).toBe(400)
    expect(snapKeyboardStep(400, 416, snap)).toBe(416)
    expect(snapKeyboardStep(400, 384, snap)).toBe(384)
    expect(snapKeyboardStep(300, 316, snap)).toBe(316)
    expect(snapKeyboardStep(390, 406, null)).toBe(406)
  })
})
