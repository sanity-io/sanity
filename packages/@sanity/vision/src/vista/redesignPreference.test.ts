import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it} from 'vitest'

import {clearLocalStorage} from '../util/localStorage'
import {
  clearRedesignPreference,
  readRedesignPreference,
  useRedesignPreference,
  writeRedesignPreference,
} from './redesignPreference'

describe('redesignPreference', () => {
  // Each test uses its own project ids, since the module keeps a per-project cache
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to not opted in and not dismissed', () => {
    expect(readRedesignPreference('fresh')).toEqual({optedIn: false, dismissed: false})
  })

  it('persists writes per project and returns the same object until the next write', () => {
    writeRedesignPreference('a', {optedIn: true})
    expect(readRedesignPreference('a')).toEqual({optedIn: true, dismissed: false})
    expect(readRedesignPreference('a')).toBe(readRedesignPreference('a'))
    expect(JSON.parse(localStorage.getItem('sanityVision:redesign:a') || '{}')).toEqual({
      optedIn: true,
      dismissed: false,
    })
    expect(readRedesignPreference('b')).toEqual({optedIn: false, dismissed: false})
  })

  it('reads stored values and ignores malformed ones', () => {
    localStorage.setItem(
      'sanityVision:redesign:stored',
      JSON.stringify({optedIn: true, dismissed: 'yes'}),
    )
    expect(readRedesignPreference('stored')).toEqual({optedIn: true, dismissed: false})

    localStorage.setItem('sanityVision:redesign:broken', '{oops')
    expect(readRedesignPreference('broken')).toEqual({optedIn: false, dismissed: false})
  })

  it('clears both flags and the stored value', () => {
    writeRedesignPreference('c', {optedIn: true, dismissed: true})
    clearRedesignPreference('c')
    expect(readRedesignPreference('c')).toEqual({optedIn: false, dismissed: false})
    expect(localStorage.getItem('sanityVision:redesign:c')).toBeNull()
  })

  it('follows the classic "Clear cache" flow, which removes the key behind its back', () => {
    writeRedesignPreference('d', {optedIn: true})
    const {result} = renderHook(() => useRedesignPreference('d'))
    expect(result.current.optedIn).toBe(true)

    act(() => clearLocalStorage())

    expect(readRedesignPreference('d')).toEqual({optedIn: false, dismissed: false})
    expect(result.current.optedIn).toBe(false)
  })
})
