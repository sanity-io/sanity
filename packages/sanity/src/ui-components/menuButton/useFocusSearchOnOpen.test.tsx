import {renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useFocusSearchOnOpen} from './useFocusSearchOnOpen'

let originalMatchMedia: typeof window.matchMedia
let intersect: ((entries: {isIntersecting: boolean}[]) => void) | undefined

class ControllableIntersectionObserver {
  constructor(callback: (entries: {isIntersecting: boolean}[]) => void) {
    intersect = callback
  }
  observe(): void {}
  disconnect(): void {}
}

describe('useFocusSearchOnOpen', () => {
  beforeEach(() => {
    intersect = undefined
    vi.stubGlobal('IntersectionObserver', ControllableIntersectionObserver)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    // A mouse or trackpad with a physical keyboard
    originalMatchMedia = window.matchMedia
    window.matchMedia = (() => ({matches: true})) as unknown as typeof window.matchMedia
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.matchMedia = originalMatchMedia
  })

  it('focuses the field when it mounts and again each time the hidden menu becomes visible', () => {
    const {result} = renderHook(() => useFocusSearchOnOpen())
    const input = document.createElement('input')
    document.body.appendChild(input)

    const cleanup = result.current(input)
    expect(document.activeElement).toBe(input)

    // The menu closes and the focus moves away; it reopens without remounting the field
    input.blur()
    expect(document.activeElement).not.toBe(input)
    intersect?.([{isIntersecting: true}])
    expect(document.activeElement).toBe(input)

    // Becoming hidden does not take the focus
    input.blur()
    intersect?.([{isIntersecting: false}])
    expect(document.activeElement).not.toBe(input)

    if (typeof cleanup === 'function') cleanup()
    input.remove()
  })

  it('does not refocus on a repeated visible report, or after the menu closed', () => {
    const {result} = renderHook(() => useFocusSearchOnOpen())
    const input = document.createElement('input')
    document.body.appendChild(input)

    const cleanup = result.current(input)
    intersect?.([{isIntersecting: true}])
    input.blur()

    // Still visible: not a new open
    intersect?.([{isIntersecting: true}])
    expect(document.activeElement).not.toBe(input)

    if (typeof cleanup === 'function') cleanup()
    input.remove()
  })
})
