import {renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it} from 'vitest'

import {type FormDocumentValue} from '../../types/formDocumentValue'
import {FormValueProvider, useFormValue} from '../FormValue'

const document = {
  _id: 'drafts.doc1',
  _type: 'author',
  name: 'Ada',
  address: {city: 'London'},
  tags: ['a', 'b'],
  books: [{_key: 'k1', title: 'First'}],
} as unknown as FormDocumentValue

function wrapper({children}: {children: ReactNode}) {
  return <FormValueProvider value={document}>{children}</FormValueProvider>
}

describe('useFormValue', () => {
  it('returns the whole document when called without a path', () => {
    const {result} = renderHook(() => useFormValue(), {wrapper})

    expect(result.current).toBe(document)
  })

  it('returns the whole document when called with an empty path', () => {
    // The documented workaround before the path became optional — it must keep working.
    const {result} = renderHook(() => useFormValue([]), {wrapper})

    expect(result.current).toBe(document)
  })

  it('resolves a nested field path', () => {
    const {result} = renderHook(() => useFormValue(['address', 'city']), {wrapper})

    expect(result.current).toBe('London')
  })

  it('resolves an indexed path into an array of primitives', () => {
    const {result} = renderHook(() => useFormValue(['tags', 1]), {wrapper})

    expect(result.current).toBe('b')
  })

  it('resolves a keyed path into an array of objects', () => {
    const {result} = renderHook(() => useFormValue(['books', {_key: 'k1'}, 'title']), {wrapper})

    expect(result.current).toBe('First')
  })

  it('throws when used outside a FormValueProvider', () => {
    expect(() => renderHook(() => useFormValue())).toThrow(
      'useFormValue must be used within a FormValueProvider',
    )
  })
})
