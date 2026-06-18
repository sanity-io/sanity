import {renderHook, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {VARIANT_DOCUMENTS_PATH, VARIANT_DOCUMENT_TYPE} from '../../../store/constants'
import {
  resetVariantDocumentGroupCountsCacheForTests,
  useVariantDocumentGroupCounts,
} from '../useVariantDocumentGroupCounts'

const listenQueryMock = vi.hoisted(() => vi.fn())

vi.mock('../../../../store', async (importOriginal) => ({
  ...(await importOriginal()),
  listenQuery: listenQueryMock,
}))

describe('useVariantDocumentGroupCounts', () => {
  beforeEach(() => {
    resetVariantDocumentGroupCountsCacheForTests()
    listenQueryMock.mockReset()
  })

  it('returns an empty map before listenQuery emits', async () => {
    listenQueryMock.mockReturnValue(of([]))

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVariantDocumentGroupCounts(), {wrapper})

    expect(result.current).toEqual(new Map())
  })

  it('maps variant document counts from listenQuery results', async () => {
    listenQueryMock.mockReturnValue(
      of([
        {_id: '_.variants.alpha', documentsCount: 3},
        {_id: '_.variants.beta', documentsCount: 0},
      ]),
    )

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVariantDocumentGroupCounts(), {wrapper})

    await waitFor(() => {
      expect(result.current).toEqual(
        new Map([
          ['_.variants.alpha', 3],
          ['_.variants.beta', 0],
        ]),
      )
    })
  })

  it('queries all variant documents with server-side counts', async () => {
    listenQueryMock.mockReturnValue(of([]))

    const wrapper = await createTestProvider()
    renderHook(() => useVariantDocumentGroupCounts(), {wrapper})

    expect(listenQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(`_type=="${VARIANT_DOCUMENT_TYPE}"`),
      {},
      expect.objectContaining({
        tag: 'variants.document-group-counts.listen',
        apiVersion: 'X',
      }),
    )

    const query = listenQueryMock.mock.calls[0][1] as string

    expect(query).toContain(`_id in path("${VARIANT_DOCUMENTS_PATH}.*")`)
    expect(query).toContain('"documentsCount": count(*[_system.variant._ref == ^._id])')
  })
})
