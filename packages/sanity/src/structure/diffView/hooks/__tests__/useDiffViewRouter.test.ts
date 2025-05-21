import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  DIFF_SEARCH_PARAM_DELIMITER,
  DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_SEARCH_PARAMETER,
} from '../constants'
import {useDiffViewRouter} from '../useDiffViewRouter'
import {mockUseRouter, mockUseRouterReturn} from '../../../../../test/mocks/useRouter.mock'

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => mockUseRouterReturn),
}))

describe('useDiffViewRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('navigateDiffView updates router search params', () => {
    mockUseRouterReturn.state._searchParams = [['foo', 'bar']]
    const {result} = renderHook(() => useDiffViewRouter())

    result.current.navigateDiffView({
      mode: 'version',
      previousDocument: {type: 'book', id: 'a'},
      nextDocument: {type: 'book', id: 'b'},
    })

    expect(mockUseRouterReturn.navigate).toHaveBeenCalledWith({
      ...mockUseRouterReturn.state,
      _searchParams: [
        ['foo', 'bar'],
        [DIFF_VIEW_SEARCH_PARAMETER, 'version'],
        [
          DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER,
          ['book', 'a'].join(DIFF_SEARCH_PARAM_DELIMITER),
        ],
        [
          DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER,
          ['book', 'b'].join(DIFF_SEARCH_PARAM_DELIMITER),
        ],
      ],
    })
  })

  it('exitDiffView removes diff related params', () => {
    mockUseRouterReturn.state._searchParams = [
      [DIFF_VIEW_SEARCH_PARAMETER, 'version'],
      [DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER, 'a,a'],
      [DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER, 'b,b'],
      ['other', '1'],
    ]
    const {result} = renderHook(() => useDiffViewRouter())

    result.current.exitDiffView()

    expect(mockUseRouterReturn.navigate).toHaveBeenCalledWith({
      ...mockUseRouterReturn.state,
      _searchParams: [['other', '1']],
    })
  })
})
