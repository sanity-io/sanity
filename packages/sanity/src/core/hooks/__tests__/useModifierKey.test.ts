import {act, renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {useModifierKey} from '../useModifierKey'

describe('useModifierKey', () => {
  it('isPressed becomes true when metaKey is held and false on keyup', () => {
    const {result} = renderHook(() => useModifierKey())

    act(() => {
      result.current.onMouseEnter()
    })

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {metaKey: true}))
    })

    expect(result.current.isPressed).toBe(true)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', {metaKey: false}))
    })

    expect(result.current.isPressed).toBe(false)
  })

  it('listeners are removed on onMouseLeave', () => {
    const {result} = renderHook(() => useModifierKey())

    act(() => {
      result.current.onMouseEnter()
    })

    act(() => {
      result.current.onMouseLeave()
    })

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {metaKey: true}))
    })

    expect(result.current.isPressed).toBe(false)
  })

  it('isPressed resets to false on window blur', () => {
    const {result} = renderHook(() => useModifierKey())

    act(() => {
      result.current.onMouseEnter()
    })

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {metaKey: true}))
    })

    expect(result.current.isPressed).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })

    expect(result.current.isPressed).toBe(false)
  })

  it('double onMouseEnter does not add duplicate listeners', () => {
    const {result} = renderHook(() => useModifierKey())

    act(() => {
      result.current.onMouseEnter()
      result.current.onMouseEnter()
    })

    act(() => {
      result.current.onMouseLeave()
    })

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {metaKey: true}))
    })

    expect(result.current.isPressed).toBe(false)
  })
})
