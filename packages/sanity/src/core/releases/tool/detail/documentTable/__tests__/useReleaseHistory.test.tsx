import {renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {getTransactionsLogs} from '../../../../../store/translog/getTransactionsLogs'
import {useReleaseHistory} from '../useReleaseHistory'

vi.mock('../../../../../store/translog/getTransactionsLogs', () => ({
  getTransactionsLogs: vi.fn(async () => []),
}))

const mockGetTransactionsLogs = vi.mocked(getTransactionsLogs)

describe('useReleaseHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches the history of the release version of a document', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useReleaseHistory('doc-1', 'rSummer', 'rev-base'), {
      wrapper,
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(
      expect.anything(),
      'versions.rSummer.doc-1',
      expect.anything(),
    )
  })

  it('fetches the history of a variant version by its own id', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(
      () => useReleaseHistory('versions.scope-loyal.doc-1', 'rSummer', 'rev-variant'),
      {wrapper},
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(
      expect.anything(),
      'versions.scope-loyal.doc-1',
      expect.anything(),
    )
  })
})
