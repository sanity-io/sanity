import {describe, expect, it} from 'vitest'

import {isApiVersionBelow} from './compareApiVersion'

describe('isApiVersionBelow', () => {
  it('compares dated versions lexicographically', () => {
    expect(isApiVersionBelow('v2021-03-25', 'v2030-01-01')).toBe(true)
    expect(isApiVersionBelow('v2022-03-07', 'v2030-01-01')).toBe(true)
    expect(isApiVersionBelow('2024-01-01', 'v2030-01-01')).toBe(true)
    expect(isApiVersionBelow('v2030-01-01', 'v2030-01-01')).toBe(false)
    expect(isApiVersionBelow('v2031-01-01', 'v2030-01-01')).toBe(false)
  })

  it('treats v1 as below dated versions and X', () => {
    expect(isApiVersionBelow('v1', 'v2030-01-01')).toBe(true)
    expect(isApiVersionBelow('v1', 'X')).toBe(true)
    expect(isApiVersionBelow('v1', 'vX')).toBe(true)
  })

  it('treats selected X as satisfying every requirement', () => {
    expect(isApiVersionBelow('vX', 'v2030-01-01')).toBe(false)
    expect(isApiVersionBelow('X', 'v2030-01-01')).toBe(false)
    expect(isApiVersionBelow('vX', 'X')).toBe(false)
    expect(isApiVersionBelow('X', 'vX')).toBe(false)
  })

  it('treats any non-X selected version as below a required X', () => {
    expect(isApiVersionBelow('v2021-03-25', 'X')).toBe(true)
    expect(isApiVersionBelow('v2030-01-01', 'X')).toBe(true)
    expect(isApiVersionBelow('v1', 'x')).toBe(true)
  })

  it('does not treat unparseable versions as below', () => {
    expect(isApiVersionBelow('other', 'v2030-01-01')).toBe(false)
    expect(isApiVersionBelow('v2030-01-01', 'other')).toBe(false)
    expect(isApiVersionBelow('', 'X')).toBe(false)
  })
})
