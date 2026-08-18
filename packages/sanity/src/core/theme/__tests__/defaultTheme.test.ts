import {describe, expect, it} from 'vitest'

import {defaultTheme, getDefaultTheme} from '../index'

describe('defaultTheme', () => {
  it('has expected top-level properties', () => {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect(defaultTheme).toHaveProperty('color')
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect(defaultTheme).toHaveProperty('fonts')
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect(defaultTheme).toHaveProperty('color')
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect(defaultTheme).toHaveProperty('container')
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect(defaultTheme).toHaveProperty('media')
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect(defaultTheme).toHaveProperty('v2')
  })

  it('supports property enumeration', () => {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    const keys = Object.keys(defaultTheme)
    expect(keys).toContain('color')
    expect(keys).toContain('fonts')
    expect(keys).toContain('v2')
  })

  it('supports the "in" operator', () => {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect('color' in defaultTheme).toBe(true)
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect('fonts' in defaultTheme).toBe(true)
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect('nonExistentProp' in defaultTheme).toBe(false)
  })

  it('supports Object.getOwnPropertyDescriptor', () => {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    const descriptor = Object.getOwnPropertyDescriptor(defaultTheme, 'color')
    expect(descriptor).toBeDefined()
    expect(descriptor?.value).toBeDefined()
  })

  it('returns the same value as getDefaultTheme()', () => {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    const direct = getDefaultTheme()
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect(defaultTheme.color).toBe(direct.color)
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect(defaultTheme.fonts).toBe(direct.fonts)
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    expect(defaultTheme.v2).toBe(direct.v2)
  })
})

describe('getDefaultTheme', () => {
  it('caches the theme instance', () => {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    const first = getDefaultTheme()
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    const second = getDefaultTheme()
    expect(first).toBe(second)
  })
})
