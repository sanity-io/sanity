import {renderHook} from '@testing-library/react'
import shallowEquals from 'shallow-equals'
import {describe, expect, it} from 'vitest'

import {useMemoCompare} from './useMemoCompare'

describe('useMemoCompare', () => {
  it('preserves the previous reference when the comparison matches', () => {
    const initial = {type: 'author'}
    const equivalent = {type: 'author'}
    const {result, rerender} = renderHook(
      ({value}: {value: {type: string}}) => useMemoCompare(value, shallowEquals),
      {initialProps: {value: initial}},
    )

    rerender({value: equivalent})

    expect(result.current).toBe(initial)
  })

  it('returns the new reference when the comparison does not match', () => {
    const initial = {type: 'author'}
    const changed = {type: 'book'}
    const {result, rerender} = renderHook(
      ({value}: {value: {type: string}}) => useMemoCompare(value, shallowEquals),
      {initialProps: {value: initial}},
    )

    rerender({value: changed})

    expect(result.current).toBe(changed)
  })

  it('treats a new nested reference as a change with a shallow comparison', () => {
    const initial = {ids: ['a']}
    const changed = {ids: ['a']}
    const {result, rerender} = renderHook(
      ({value}: {value: {ids: string[]}}) => useMemoCompare(value, shallowEquals),
      {initialProps: {value: initial}},
    )

    rerender({value: changed})

    expect(result.current).toBe(changed)
  })
})
