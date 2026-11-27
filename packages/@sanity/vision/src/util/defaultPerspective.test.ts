import {describe, expect, it} from 'vitest'

import {getDefaultPerspective} from './defaultPerspective'

describe('getDefaultPerspective', () => {
  it('reads published from API version 2025-02-19', () => {
    expect(getDefaultPerspective('v2025-02-19')).toBe('published')
    expect(getDefaultPerspective('2025-02-19')).toBe('published')
    expect(getDefaultPerspective('v2026-11-27')).toBe('published')
  })

  it('reads raw before API version 2025-02-19', () => {
    expect(getDefaultPerspective('v2025-02-18')).toBe('raw')
    expect(getDefaultPerspective('v2022-03-07')).toBe('raw')
    expect(getDefaultPerspective('v2021-03-25')).toBe('raw')
    expect(getDefaultPerspective('2021-10-21')).toBe('raw')
  })

  it('reads raw on v1 and published on the experimental vX', () => {
    expect(getDefaultPerspective('v1')).toBe('raw')
    expect(getDefaultPerspective('1')).toBe('raw')
    expect(getDefaultPerspective('vX')).toBe('published')
    expect(getDefaultPerspective('X')).toBe('published')
    expect(getDefaultPerspective('vx')).toBe('published')
  })

  it('has no default for a version that does not parse', () => {
    expect(getDefaultPerspective('')).toBeUndefined()
    expect(getDefaultPerspective('v2025')).toBeUndefined()
    expect(getDefaultPerspective('v2025-13-45')).toBeUndefined()
    expect(getDefaultPerspective('other')).toBeUndefined()
  })
})
