import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useCursorElement} from '../useCursorElement'

describe('useCursorElement', () => {
  let root: HTMLDivElement
  let textNode: Text
  let originalGetBoundingClientRect: typeof Range.prototype.getBoundingClientRect

  beforeEach(() => {
    vi.useFakeTimers({toFake: ['requestAnimationFrame', 'cancelAnimationFrame']})
    root = document.createElement('div')
    textNode = document.createTextNode('Hey @cod')
    root.appendChild(textNode)
    document.body.appendChild(root)

    // jsdom's Range often lacks layout APIs.
    originalGetBoundingClientRect = Range.prototype.getBoundingClientRect
    Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
      return new DOMRect(0, 0, 0, 16)
    }
  })

  afterEach(() => {
    root.remove()
    window.getSelection()?.removeAllRanges()
    Range.prototype.getBoundingClientRect = originalGetBoundingClientRect
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function placeCaretAtEnd() {
    const range = document.createRange()
    range.setStart(textNode, textNode.length)
    range.collapse(true)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    return range
  }

  it('returns null when disabled', () => {
    const {result} = renderHook(() => useCursorElement({disabled: true, rootElement: root}))
    act(() => {
      placeCaretAtEnd()
      document.dispatchEvent(new Event('selectionchange'))
    })
    expect(result.current).toBeNull()
  })

  it('exposes a caret reference with contextElement for Floating UI scroll ancestors', () => {
    const {result} = renderHook(() => useCursorElement({disabled: false, rootElement: root}))

    act(() => {
      placeCaretAtEnd()
      document.dispatchEvent(new Event('selectionchange'))
    })

    expect(result.current).not.toBeNull()
    expect((result.current as {contextElement?: Element}).contextElement).toBe(root)
  })

  it('refreshes getBoundingClientRect after scroll so the popover stays on the caret', () => {
    const initialRect = new DOMRect(100, 200, 0, 16)
    const scrolledRect = new DOMRect(100, 80, 0, 16)
    let rectToReturn = initialRect

    Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
      return rectToReturn
    }

    const {result} = renderHook(() => useCursorElement({disabled: false, rootElement: root}))

    act(() => {
      placeCaretAtEnd()
      document.dispatchEvent(new Event('selectionchange'))
    })

    expect(result.current?.getBoundingClientRect()).toEqual(initialRect)

    rectToReturn = scrolledRect

    act(() => {
      // Capture-phase listener (pane scroll is often not an ancestor of the portal).
      document.dispatchEvent(new Event('scroll', {bubbles: false}))
      vi.runAllTimers()
    })

    expect(result.current?.getBoundingClientRect()).toEqual(scrolledRect)
  })
})
