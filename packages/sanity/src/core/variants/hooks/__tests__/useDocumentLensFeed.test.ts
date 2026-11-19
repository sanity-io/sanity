import {renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {buildInventoryIndex} from '../../../inventoryModel/buildInventoryIndex'
import {INITIAL_VERSION_FEED_STATE} from '../../../inventoryModel/feed/createVersionFeed'
import {DOCUMENT_LENS_PAGE_SIZE, useDocumentLensFeed} from '../useDocumentLensFeed'

const useVersionFeedMock = vi.hoisted(() => vi.fn())

vi.mock('../../../inventoryModel/feed/useVersionFeed', () => ({
  useVersionFeed: useVersionFeedMock,
}))

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({data: [], byId: new Map(), loading: false, error: null})),
}))

describe('useDocumentLensFeed', () => {
  it('reads the feed 50 documents a page at most, to keep listener URLs short', () => {
    useVersionFeedMock.mockReturnValue({
      state: INITIAL_VERSION_FEED_STATE,
      index: buildInventoryIndex({versions: [], releases: new Map()}),
      setVisibleRange: vi.fn(),
    })

    renderHook(() => useDocumentLensFeed({type: undefined, filters: {}, sort: 'last-edited'}))

    expect(DOCUMENT_LENS_PAGE_SIZE).toBeLessThanOrEqual(50)
    expect(useVersionFeedMock).toHaveBeenCalledWith(
      expect.objectContaining({pageSize: DOCUMENT_LENS_PAGE_SIZE}),
    )
  })
})
