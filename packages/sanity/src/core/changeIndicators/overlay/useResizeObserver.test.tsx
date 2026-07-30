import {render} from '@testing-library/react'
import {forwardRef, memo} from 'react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {useResizeObserver} from './useResizeObserver'

/**
 * `useResizeObserver` only re-subscribes when `element` changes, so the effect
 * event is what delivers the current `onResize` to the observer callback.
 *
 * React 19.2's native `useEffectEvent` never sees values past the first render
 * when the calling component is wrapped in `forwardRef` or `memo`
 * (https://github.com/facebook/react/issues/34818) — hence the
 * `use-effect-event` import. This test fails if that import is switched to
 * `react` before the upstream fix ships in the lowest React we support.
 */
describe('useResizeObserver', () => {
  const callbacks = new Map<Element, ResizeObserverCallback>()

  beforeEach(() => {
    callbacks.clear()

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private callback: ResizeObserverCallback) {}
        observe(element: Element) {
          callbacks.set(element, this.callback)
        }
        unobserve() {}
        disconnect() {}
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function resize(element: Element) {
    const callback = callbacks.get(element)
    if (!callback) throw new Error('element is not observed')
    const entry = {target: element} as ResizeObserverEntry
    callback([entry], {} as ResizeObserver)
  }

  test('calls the latest onResize from forwardRef and memo components', () => {
    const forwardRefElement = document.createElement('div')
    const memoElement = document.createElement('div')

    const ForwardRefComp = forwardRef<HTMLDivElement, {onResize: () => void}>(
      function ForwardRefComp({onResize}, ref) {
        useResizeObserver(forwardRefElement, onResize)
        return <div ref={ref} />
      },
    )

    const MemoComp = memo(function MemoComp({onResize}: {onResize: () => void}) {
      useResizeObserver(memoElement, onResize)
      return null
    })

    const staleForwardRef = vi.fn()
    const staleMemo = vi.fn()

    const {rerender} = render(
      <>
        <ForwardRefComp onResize={staleForwardRef} />
        <MemoComp onResize={staleMemo} />
      </>,
    )

    const latestForwardRef = vi.fn()
    const latestMemo = vi.fn()

    rerender(
      <>
        <ForwardRefComp onResize={latestForwardRef} />
        <MemoComp onResize={latestMemo} />
      </>,
    )

    resize(forwardRefElement)
    resize(memoElement)

    expect(latestForwardRef).toHaveBeenCalledTimes(1)
    expect(latestMemo).toHaveBeenCalledTimes(1)
    expect(staleForwardRef).not.toHaveBeenCalled()
    expect(staleMemo).not.toHaveBeenCalled()
  })
})
