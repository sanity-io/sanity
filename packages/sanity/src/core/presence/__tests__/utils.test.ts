import {describe, expect, it} from 'vitest'

import {AVATAR_DISTANCE, AVATAR_SIZE} from '../constants'
import {calcAvatarStackWidth, splitRight} from '../utils'

describe('splitRight', () => {
  it('keeps everything visible when there are fewer items than the maximum', () => {
    expect(splitRight(['a', 'b'], 3)).toEqual([[], ['a', 'b']])
  })

  it('keeps everything visible when there are exactly as many items as the maximum', () => {
    expect(splitRight(['a', 'b', 'c'], 3)).toEqual([[], ['a', 'b', 'c']])
  })

  it('reserves one slot for the counter when there are more items than the maximum', () => {
    // 10 items, max 3: two remain visible, the third slot shows the count of the 8 hidden ones
    const [hidden, visible] = splitRight(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 3)
    expect(hidden).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
    expect(visible).toEqual(['i', 'j'])
  })

  it('hides the leftmost items and keeps the rightmost ones', () => {
    // 10 items, max 4 (a field header): three remain visible, 7 are hidden
    const [hidden, visible] = splitRight(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 4)
    expect(hidden).toHaveLength(7)
    expect(visible).toEqual(['h', 'i', 'j'])
  })

  it('handles an empty list', () => {
    expect(splitRight([], 3)).toEqual([[], []])
  })
})

describe('calcAvatarStackWidth', () => {
  // 25px avatars overlapping by 4px
  it('is one avatar wide for a single avatar', () => {
    expect(AVATAR_SIZE).toBe(25)
    expect(AVATAR_DISTANCE).toBe(-4)
    expect(calcAvatarStackWidth(1)).toBe(25)
  })

  it('grows by an avatar minus the overlap for every further avatar', () => {
    expect(calcAvatarStackWidth(2)).toBe(46)
    expect(calcAvatarStackWidth(4)).toBe(88)
  })

  it('leaves the overlap as the width of an empty stack', () => {
    expect(calcAvatarStackWidth(0)).toBe(4)
  })
})
