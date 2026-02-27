import {describe, expect, it} from 'vitest'

import {defaultTheme, getDefaultTheme} from '../index'

describe('defaultTheme', () => {
  it('has expected top-level properties', () => {
    expect(defaultTheme).toHaveProperty('color')
    expect(defaultTheme).toHaveProperty('fonts')
    expect(defaultTheme).toHaveProperty('color')
    expect(defaultTheme).toHaveProperty('container')
    expect(defaultTheme).toHaveProperty('media')
    expect(defaultTheme).toHaveProperty('v2')
  })

  it('supports property enumeration', () => {
    const keys = Object.keys(defaultTheme)
    expect(keys).toContain('color')
    expect(keys).toContain('fonts')
    expect(keys).toContain('v2')
  })

  it('supports the "in" operator', () => {
    expect('color' in defaultTheme).toBe(true)
    expect('fonts' in defaultTheme).toBe(true)
    expect('nonExistentProp' in defaultTheme).toBe(false)
  })

  it('supports Object.getOwnPropertyDescriptor', () => {
    const descriptor = Object.getOwnPropertyDescriptor(defaultTheme, 'color')
    expect(descriptor).toBeDefined()
    expect(descriptor?.value).toBeDefined()
  })

  it('returns the same value as getDefaultTheme()', () => {
    const direct = getDefaultTheme()
    expect(defaultTheme.color).toBe(direct.color)
    expect(defaultTheme.fonts).toBe(direct.fonts)
    expect(defaultTheme.v2).toBe(direct.v2)
  })
})

describe('getDefaultTheme', () => {
  it('caches the theme instance', () => {
    const first = getDefaultTheme()
    const second = getDefaultTheme()
    expect(first).toBe(second)
  })
})
