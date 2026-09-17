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

  it('keeps the previous identity when object contents are deeply equal', () => {
    const initial = {id: 'a', member: {nested: true}}
    const {result, rerender} = renderHook(({value}) => useShallowUnique(value), {
      initialProps: {value: initial},
    })

    // dequal/lite compares plain objects deeply: a rebuilt nested object with
    // equal contents is not a change
    rerender({value: {id: 'a', member: {nested: true}}})
    expect(result.current).toBe(initial)

    const changed = {id: 'a', member: {nested: false}}
    rerender({value: changed})
    expect(result.current).toBe(changed)
  })

  it('compares functions by identity', () => {
    // dequal/lite falls through to identity for functions — two different
    // plain functions must count as a change, or a stale first function
    // would be pinned forever for union-typed params that may hold callbacks.
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

  it('compares class instances by identity, including when nested', () => {
    // dequal/lite walks class instances by enumerable own keys and ignores
    // private fields, so two distinct clients with the same public shape
    // would otherwise pin the first instance forever.
    class TokenClient {
      #token: string
      constructor(token: string) {
        this.#token = token
      }
      get token() {
        return this.#token
      }
    }

    const first = new TokenClient('a')
    const {result, rerender} = renderHook(({value}) => useShallowUnique(value), {
      initialProps: {value: {client: first, id: 'doc'}},
    })
    expect(result.current.client).toBe(first)

    const secondWrapped = {client: new TokenClient('b'), id: 'doc'}
    rerender({value: secondWrapped})
    expect(result.current).toBe(secondWrapped)

    rerender({value: {client: secondWrapped.client, id: 'doc'}})
    expect(result.current).toBe(secondWrapped)
  })

  it('does not recurse into cyclic class instances', () => {
    class CyclicClient {
      observable: {parent: CyclicClient}
      constructor() {
        this.observable = {parent: this}
      }
    }

    const first = new CyclicClient()
    const {result, rerender} = renderHook(({value}) => useShallowUnique(value), {
      initialProps: {value: {client: first}},
    })
    expect(result.current.client).toBe(first)

    const second = new CyclicClient()
    rerender({value: {client: second}})
    expect(result.current.client).toBe(second)
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
