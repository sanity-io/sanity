import {render} from '@testing-library/react'
// oxlint-disable-next-line eslint/no-restricted-imports -- intentional: regression coverage for facebook/react#34818 still needs a real forwardRef fiber
import {forwardRef, memo, useEffect} from 'react'
import {useEffectEvent} from 'use-effect-event'
import {describe, expect, test, vi} from 'vitest'

/**
 * React 19.2's native `useEffectEvent` never sees values past the first render
 * when the calling component is wrapped in `forwardRef` or `memo`
 * (https://github.com/facebook/react/issues/34818). This test fails if the
 * ponyfill is replaced with the native hook before the upstream fix ships in
 * the lowest React version we support. Studio code must not use `forwardRef`
 * (see oxlint ban); this file is the sole exception so we keep covering that fiber.
 */
describe('useEffectEvent', () => {
  test('calls the latest callback from forwardRef and memo components', () => {
    const listeners = new Set<() => void>()

    function useListener(callback: () => void) {
      const onEvent = useEffectEvent(callback)

      useEffect(() => {
        listeners.add(onEvent)
        return () => {
          listeners.delete(onEvent)
        }
      }, [])
    }

    const ForwardRefComp = forwardRef<HTMLDivElement, {onEvent: () => void}>(
      function ForwardRefComp({onEvent}, ref) {
        useListener(onEvent)
        return <div ref={ref} />
      },
    )

    const MemoComp = memo(function MemoComp({onEvent}: {onEvent: () => void}) {
      useListener(onEvent)
      return null
    })

    const staleForwardRef = vi.fn()
    const staleMemo = vi.fn()

    const {rerender} = render(
      <>
        <ForwardRefComp onEvent={staleForwardRef} />
        <MemoComp onEvent={staleMemo} />
      </>,
    )

    const latestForwardRef = vi.fn()
    const latestMemo = vi.fn()

    rerender(
      <>
        <ForwardRefComp onEvent={latestForwardRef} />
        <MemoComp onEvent={latestMemo} />
      </>,
    )

    for (const listener of listeners) listener()

    expect(latestForwardRef).toHaveBeenCalledTimes(1)
    expect(latestMemo).toHaveBeenCalledTimes(1)
    expect(staleForwardRef).not.toHaveBeenCalled()
    expect(staleMemo).not.toHaveBeenCalled()
  })
})
