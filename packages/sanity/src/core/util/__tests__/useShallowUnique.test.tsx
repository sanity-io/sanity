import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {useShallowUnique} from '../useShallowUnique'

describe('useShallowUnique', () => {
  it('keeps the previous identity when array contents are equal', () => {
    const initial = ['title', 'name']
    const {result, rerender} = renderHook(({value}) => useShallowUnique(value), {
      initialProps: {value: initial},
    })
    expect(result.current).toBe(initial)

    rerender({value: ['title', 'name']})
    expect(result.current).toBe(initial)

    const changed = ['title', 'slug']
    rerender({value: changed})
    expect(result.current).toBe(changed)
  })

  it('keeps the previous identity when object contents are equal', () => {
    const member = {nested: true}
    const initial = {id: 'a', member}
    const {result, rerender} = renderHook(({value}) => useShallowUnique(value), {
      initialProps: {value: initial},
    })

    rerender({value: {id: 'a', member}})
    expect(result.current).toBe(initial)

    // Members compare by reference: a new nested identity is a change
    const changed = {id: 'a', member: {nested: true}}
    rerender({value: changed})
    expect(result.current).toBe(changed)
  })

  it('compares functions by identity, not by enumerable keys', () => {
    // shallow-equals reports two different plain functions as equal (it
    // compares their own enumerable keys, of which plain functions have
    // none). That would pin a stale first function forever for union-typed
    // params that may hold callbacks.
    const first = () => 'first'
    const {result, rerender} = renderHook(({value}) => useShallowUnique<() => string>(value), {
      initialProps: {value: first},
    })
    expect(result.current).toBe(first)

    const second = () => 'second'
    rerender({value: second})
    expect(result.current).toBe(second)

    rerender({value: second})
    expect(result.current).toBe(second)
  })

  it('passes primitives through', () => {
    const {result, rerender} = renderHook(
      ({value}) => useShallowUnique<string | undefined>(value),
      {
        initialProps: {value: 'a' as string | undefined},
      },
    )
    expect(result.current).toBe('a')
    rerender({value: undefined})
    expect(result.current).toBe(undefined)
    rerender({value: 'b'})
    expect(result.current).toBe('b')
  })
})
