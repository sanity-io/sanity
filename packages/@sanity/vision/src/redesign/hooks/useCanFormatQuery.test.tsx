import {act, cleanup, renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {FORMAT_RECHECK_MS, useCanFormatQuery} from './useCanFormatQuery'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useCanFormatQuery', () => {
  it('offers Format only when formatting would change the query, and drops a query that does not parse', async () => {
    const formatForEditor = vi.fn(async (query: string) => {
      if (query.endsWith('"')) throw new Error('parse')
      return query.includes(' == ') ? query : `${query} formatted`
    })
    const {result, rerender} = renderHook(
      ({query}: {query: string}) => useCanFormatQuery(query, formatForEditor, null),
      {initialProps: {query: '*[_type=="author"]'}},
    )
    await act(async () => {})
    expect(result.current).toBe(true)

    rerender({query: '*[_type == "author"]'})
    await act(async () => {})
    expect(result.current).toBe(false)

    rerender({query: '*[_type=="author"'})
    await act(async () => {})
    expect(result.current).toBe(false)
  })

  it('rechecks after the editor is resized, once the resize has settled', async () => {
    vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout']})
    let formatted = 'wrapped'
    const formatForEditor = vi.fn(async () => formatted)
    const {result, rerender} = renderHook(
      ({size}: {size: {width: number; height: number} | null}) =>
        useCanFormatQuery('query', formatForEditor, size),
      {initialProps: {size: {width: 400, height: 200} as {width: number; height: number} | null}},
    )
    await act(async () => {})
    expect(result.current).toBe(true)
    expect(formatForEditor).toHaveBeenCalledTimes(1)

    // Wider now, so the query is already at the width it would format to
    formatted = 'query'
    rerender({size: {width: 800, height: 200}})
    await act(async () => {
      vi.advanceTimersByTime(FORMAT_RECHECK_MS - 1)
    })
    expect(formatForEditor).toHaveBeenCalledTimes(1)
    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(false)

    // A collapsed editor has no width to format for, so the last answer stands
    formatted = 'wrapped again'
    rerender({size: {width: 0, height: 0}})
    await act(async () => {
      vi.advanceTimersByTime(FORMAT_RECHECK_MS)
    })
    expect(formatForEditor).toHaveBeenCalledTimes(2)
    expect(result.current).toBe(false)
  })
})
