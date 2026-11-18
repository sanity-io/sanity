import {renderHook} from '@testing-library/react'
import {type RouterContextValue, useRouter} from 'sanity/router'
import {describe, expect, it, vi} from 'vitest'

import {useDiffViewRouter} from './useDiffViewRouter'

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(),
}))

function routerWith(searchParams: [string, string][]) {
  const navigate = vi.fn()
  vi.mocked(useRouter).mockReturnValue({
    state: {_searchParams: searchParams},
    stickyParams: {},
    resolvePathFromState: vi.fn(),
    resolveIntentLink: vi.fn(),
    navigateUrl: vi.fn(),
    // oxlint-disable-next-line no-deprecated -- the router value still carries it
    navigateStickyParams: vi.fn(),
    navigate,
    navigateIntent: vi.fn(),
  } satisfies RouterContextValue)
  return navigate
}

describe('useDiffViewRouter', () => {
  it('removes a side passed as null, so an earlier one does not linger', () => {
    const navigate = routerWith([
      ['diffView', 'version'],
      ['previousDocument', 'article,doc-1'],
      ['nextDocument', 'article,drafts.doc-1'],
    ])
    const {result} = renderHook(() => useDiffViewRouter())

    result.current.navigateDiffView({
      mode: 'version',
      previousDocument: {type: 'article', id: 'doc-1'},
      nextDocument: null,
    })

    expect(navigate).toHaveBeenCalledWith({
      _searchParams: [
        ['diffView', 'version'],
        ['previousDocument', 'article,doc-1'],
      ],
    })
  })

  it('keeps a side that is left out', () => {
    const navigate = routerWith([
      ['diffView', 'version'],
      ['previousDocument', 'article,doc-1'],
      ['nextDocument', 'article,drafts.doc-1'],
    ])
    const {result} = renderHook(() => useDiffViewRouter())

    result.current.navigateDiffView({previousDocument: {type: 'article', id: 'doc-2'}})

    expect(navigate.mock.calls[0][0]._searchParams).toContainEqual([
      'nextDocument',
      'article,drafts.doc-1',
    ])
  })
})
