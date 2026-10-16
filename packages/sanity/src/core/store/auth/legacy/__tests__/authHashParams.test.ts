import {describe, expect, it} from 'vitest'

import {removeAuthHashParams} from '../authHashParams'

describe('removeAuthHashParams', () => {
  it('returns a hash without auth params unchanged', () => {
    expect(removeAuthHashParams('#a&&b')).toBe('#a&&b')
  })

  it('returns an empty hash unchanged', () => {
    expect(removeAuthHashParams('#')).toBe('#')
  })

  it('removes auth params and keeps the others', () => {
    expect(removeAuthHashParams('#sid=x&a=1')).toBe('#a=1')
  })
})
