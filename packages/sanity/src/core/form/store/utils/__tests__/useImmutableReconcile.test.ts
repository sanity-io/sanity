import {renderHook} from '@testing-library/react'
import {StrictMode} from 'react'
import {describe, expect, it} from 'vitest'

import {useImmutableReconcile} from '../useImmutableReconcile'

describe('useImmutableReconcile', () => {
  it('returns the previous identity when the next value is deeply equal', () => {
    const {result, rerender} = renderHook(
      ({value}: {value: {arr: {foo: string}[]}}) => {
        const reconcile = useImmutableReconcile<typeof value>()
        return reconcile(value)
      },
      {initialProps: {value: {arr: [{foo: 'bar'}]}}},
    )

    const first = result.current
    rerender({value: {arr: [{foo: 'bar'}]}})
    expect(result.current).toBe(first)
  })

  it('returns a new identity when the next value differs', () => {
    const {result, rerender} = renderHook(
      ({value}: {value: {foo: string}}) => {
        const reconcile = useImmutableReconcile<typeof value>()
        return reconcile(value)
      },
      {initialProps: {value: {foo: 'bar'}}},
    )

    const first = result.current
    rerender({value: {foo: 'baz'}})
    expect(result.current).not.toBe(first)
    expect(result.current).toEqual({foo: 'baz'})
  })

  it('keeps previous identity under StrictMode when values are equal', () => {
    const {result, rerender} = renderHook(
      ({value}: {value: {foo: string}}) => {
        const reconcile = useImmutableReconcile<typeof value>()
        return reconcile(value)
      },
      {initialProps: {value: {foo: 'bar'}}, wrapper: StrictMode},
    )

    const first = result.current
    rerender({value: {foo: 'bar'}})
    expect(result.current).toBe(first)
  })
})
