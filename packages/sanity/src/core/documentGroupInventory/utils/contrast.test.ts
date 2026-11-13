import {describe, expect, it} from 'vitest'

import {contrastRatio, mixToContrast, parseColor} from './contrast'

describe('mixToContrast', () => {
  it.each([
    ['light', '#252837', '#ffffff'],
    ['light header', '#252837', '#f6f6f8'],
    ['dark', '#e4e5e9', '#13141b'],
    ['dark header', '#e4e5e9', '#191a24'],
  ])('reaches 3:1 and no more than it needs to, in %s', (_name, fg, bg) => {
    const ratio = contrastRatio(parseColor(mixToContrast(fg, bg, 3))!, parseColor(bg)!)
    expect(ratio).toBeGreaterThanOrEqual(3)
    expect(ratio).toBeLessThan(3.2)
  })

  it('falls back to the foreground when it cannot reach the ratio, or read a colour', () => {
    expect(mixToContrast('#eeeeee', '#ffffff', 3)).toBe('#eeeeee')
    expect(mixToContrast('var(--x)', '#ffffff', 3)).toBe('var(--x)')
  })
})

describe('parseColor', () => {
  it('reads hex, rgb() and a computed color(srgb …)', () => {
    expect(parseColor('#556bfc')).toEqual([85, 107, 252])
    expect(parseColor('rgb(1, 2, 3)')).toEqual([1, 2, 3])
    expect(parseColor('color(srgb 1 0 0.5)')).toEqual([255, 0, 127.5])
  })
})
