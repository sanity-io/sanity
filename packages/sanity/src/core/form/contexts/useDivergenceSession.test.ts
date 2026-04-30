import {act, renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {type DivergenceNavigatorState} from '../../divergence/divergenceNavigator'
import {useDivergenceSession} from './useDivergenceSession'

const emptyState: DivergenceNavigatorState = {
  focusedDivergence: undefined,
  previousDivergence: undefined,
  nextDivergence: undefined,
  state: 'pending',
  upstreamId: undefined,
  allDivergences: [],
  divergences: [],
  divergencesByNode: {},
}

function ready(count: number): DivergenceNavigatorState {
  return {
    ...emptyState,
    state: 'ready',
    // The path object's contents are irrelevant to session logic.
    divergences: Array.from({length: count}, (_, index) => [
      `path-${index}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
    ]),
  }
}

const readyZero: DivergenceNavigatorState = {...emptyState, state: 'ready'}

describe('useDivergenceSession', () => {
  it('returns the same id on repeated beginSession() calls', () => {
    const {result} = renderHook(() => useDivergenceSession(ready(1)))
    const first = result.current.beginSession()
    const second = result.current.beginSession()
    expect(first).toBe(second)
    expect(typeof first).toBe('string')
    expect(first.length).toBeGreaterThan(0)
  })

  it('does not clear the session while navigator is pending with zero divergences', () => {
    const {result, rerender} = renderHook(
      (state: DivergenceNavigatorState) => useDivergenceSession(state),
      {
        initialProps: ready(2),
      },
    )
    const initial = result.current.beginSession()

    act(() => {
      rerender(emptyState)
    })

    expect(result.current.beginSession()).toBe(initial)
  })

  it('clears the session when the navigator settles with zero divergences', () => {
    const {result, rerender} = renderHook(
      (state: DivergenceNavigatorState) => useDivergenceSession(state),
      {
        initialProps: ready(1),
      },
    )
    const initial = result.current.beginSession()

    act(() => {
      rerender(readyZero)
    })

    const next = result.current.beginSession()
    expect(next).not.toBe(initial)
  })

  it('mints a fresh id after clearing and resurfacing', () => {
    const {result, rerender} = renderHook(
      (state: DivergenceNavigatorState) => useDivergenceSession(state),
      {
        initialProps: ready(1),
      },
    )
    const initial = result.current.beginSession()

    act(() => {
      rerender(readyZero)
    })
    act(() => {
      rerender(ready(1))
    })

    const resurfaced = result.current.beginSession()
    expect(resurfaced).not.toBe(initial)
    expect(typeof resurfaced).toBe('string')
  })
})
