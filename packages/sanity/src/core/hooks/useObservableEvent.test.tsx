import {act, render} from '@testing-library/react'
import {forwardRef, memo, useEffect} from 'react'
import {map, type Observable, tap} from 'rxjs'
import {describe, expect, test} from 'vitest'

import {useObservableEvent} from './useObservableEvent'

const EVENT_NAME = 'sanity-use-observable-event-regression'

/**
 * `useObservableEvent` builds its pipeline once per subscription (same as
 * react-rx), so closed-over render values are fixed at subscribe time. This
 * test pins that the local copy — which routes through our safe
 * `useEffectEvent` shim — still wires events correctly inside `forwardRef`
 * and `memo` callers (e.g. DocumentListPane). The forwardRef/memo freshness
 * contract for the underlying effect-event hook is covered by
 * `useEffectEvent.test.tsx`.
 *
 * Keep this module off `react-rx@5`'s native `useEffectEvent` until
 * https://github.com/facebook/react/issues/34818 is fixed in the lowest
 * React we support.
 */
describe('useObservableEvent', () => {
  test('delivers events through the handler pipeline in forwardRef and memo components', () => {
    const seen: string[] = []

    function usePush(label: string) {
      const onEvent = useObservableEvent((values$: Observable<string>) =>
        values$.pipe(
          map((value) => `${label}:${value}`),
          tap((value) => {
            seen.push(value)
          }),
        ),
      )

      useEffect(() => {
        const handler = () => onEvent('ping')
        window.addEventListener(EVENT_NAME, handler)
        return () => window.removeEventListener(EVENT_NAME, handler)
      }, [onEvent])
    }

    const ForwardRefComp = forwardRef<HTMLDivElement>(function ForwardRefComp(_, ref) {
      usePush('forwardRef')
      return <div ref={ref} />
    })

    const MemoComp = memo(function MemoComp() {
      usePush('memo')
      return null
    })

    render(
      <>
        <ForwardRefComp />
        <MemoComp />
      </>,
    )

    act(() => {
      window.dispatchEvent(new Event(EVENT_NAME))
    })

    expect(seen).toEqual(['forwardRef:ping', 'memo:ping'])
  })
})
