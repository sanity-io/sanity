import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  DIFF_SEARCH_PARAM_DELIMITER,
  DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_SEARCH_PARAMETER,
} from '../../constants'
import {useDiffViewState} from '../useDiffViewState'
import {mockUseRouter, mockUseRouterReturn} from '../../../../../test/mocks/useRouter.mock'

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => mockUseRouterReturn),
}))

describe('useDiffViewState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns inactive when no params set', () => {
    mockUseRouterReturn.state._searchParams = []
    const {result} = renderHook(() => useDiffViewState())
    expect(result.current).toEqual({isActive: false})
  })

  it('parses valid params', () => {
    mockUseRouterReturn.state._searchParams = [
      [DIFF_VIEW_SEARCH_PARAMETER, 'version'],
      [
        DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER,
        ['book', 'a'].join(DIFF_SEARCH_PARAM_DELIMITER),
      ],
      [DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER, ['book', 'b'].join(DIFF_SEARCH_PARAM_DELIMITER)],
    ]
    const {result} = renderHook(() => useDiffViewState())
    expect(result.current).toEqual({
      isActive: true,
      state: 'ready',
      mode: 'version',
      documents: {previous: {type: 'book', id: 'a'}, next: {type: 'book', id: 'b'}},
    })
  })

  it('reports error for invalid params', () => {
    const errors: any[] = []
    mockUseRouterReturn.state._searchParams = [
      [DIFF_VIEW_SEARCH_PARAMETER, 'invalid'],
      [DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER, 'wrong'],
    ]
    const {result} = renderHook(() => useDiffViewState({onParamsError: (e) => errors.push(e)}))
    expect(result.current).toEqual({isActive: false})
    expect(errors.length).toBeGreaterThan(0)
  })
})
