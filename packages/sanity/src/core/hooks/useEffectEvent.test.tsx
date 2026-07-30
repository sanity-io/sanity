import {act, render} from '@testing-library/react'
import {forwardRef, memo, useEffect} from 'react'
import {describe, expect, test} from 'vitest'

import {useEffectEvent} from './useEffectEvent'

const EVENT_NAME = 'sanity-use-effect-event-regression'

/**
 * Guards against switching this module to React's native `useEffectEvent`
 * before https://github.com/facebook/react/issues/34818 is fixed in the
 * lowest React version we support. Native fails this contract in
 * `forwardRef` and `memo` components on React 19.2.
 */
describe('useEffectEvent', () => {
  test('callback sees the latest props in forwardRef and memo components', () => {
    const seen: string[] = []

    function usePush(label: string, n: number) {
      const onEvent = useEffectEvent(() => {
        seen.push(`${label}:${n}`)
      })
      useEffect(() => {
        const handler = () => onEvent()
        window.addEventListener(EVENT_NAME, handler)
        return () => window.removeEventListener(EVENT_NAME, handler)
        // onEvent is an effect event — must not be listed as a dependency
      }, [])
    }

    const ForwardRefComp = forwardRef<HTMLDivElement, {n: number}>(function ForwardRefComp(
      {n},
      ref,
    ) {
      usePush('forwardRef', n)
      return <div ref={ref} />
    })

    const MemoComp = memo(function MemoComp({n}: {n: number}) {
      usePush('memo', n)
      return null
    })

    const {rerender} = render(
      <>
        <ForwardRefComp n={0} />
        <MemoComp n={0} />
      </>,
    )

    rerender(
      <>
        <ForwardRefComp n={1} />
        <MemoComp n={1} />
      </>,
    )

    act(() => {
      window.dispatchEvent(new Event(EVENT_NAME))
    })

    expect(seen).toEqual(['forwardRef:1', 'memo:1'])
  })
})
