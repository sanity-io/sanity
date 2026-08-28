import {act, renderHook, waitFor} from '@testing-library/react'
import {type Observable, of, Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {useSearchMachine} from '../useSearchMachine'

describe('useSearchMachine', () => {
  it('searches and exposes hits', async () => {
    const search = vi.fn((query: string) => of([`hit for ${query}`]))
    const {result} = renderHook(() => useSearchMachine<string>({search}))

    expect(result.current.searchState).toEqual({
      hits: [],
      isLoading: false,
      searchString: undefined,
    })

    act(() => result.current.handleQueryChange('foo'))

    await waitFor(() => {
      expect(result.current.searchState).toEqual({
        hits: ['hit for foo'],
        isLoading: false,
        searchString: 'foo',
      })
    })
    expect(search).toHaveBeenCalledWith('foo')
  })

  it('ignores null queries', () => {
    const search = vi.fn((query: string) => of([query]))
    const {result} = renderHook(() => useSearchMachine<string>({search}))

    act(() => result.current.handleQueryChange(null))

    expect(search).not.toHaveBeenCalled()
    expect(result.current.searchState.isLoading).toBe(false)
  })

  it('calls the latest search function from the latest render', async () => {
    const initialSearch = vi.fn((query: string) => of([`initial ${query}`]))
    const replacedSearch = vi.fn((query: string) => of([`replaced ${query}`]))

    const {result, rerender} = renderHook(
      ({search}: {search: (query: string) => Observable<string[]>}) =>
        useSearchMachine<string>({search}),
      {initialProps: {search: initialSearch}},
    )

    rerender({search: replacedSearch})
    act(() => result.current.handleQueryChange('foo'))

    await waitFor(() => {
      expect(result.current.searchState.hits).toEqual(['replaced foo'])
    })
    expect(initialSearch).not.toHaveBeenCalled()
  })

  it('reports failures through onSearchFailed and stops loading', async () => {
    const failure = new Error('search exploded')
    const onSearchFailed = vi.fn()
    const subject = new Subject<string[]>()
    const search = vi.fn(() => subject)
    const {result} = renderHook(() => useSearchMachine<string>({search, onSearchFailed}))

    act(() => result.current.handleQueryChange('foo'))
    await waitFor(() => expect(search).toHaveBeenCalled())
    act(() => subject.error(failure))

    await waitFor(() => {
      expect(result.current.searchState).toEqual({
        hits: [],
        isLoading: false,
        searchString: 'foo',
      })
    })
    expect(onSearchFailed).toHaveBeenCalledWith(failure)
  })
})
