import {renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {getTransactionsLogs} from '../../../../../store/translog/getTransactionsLogs'
import {MAX_CONCURRENT_HISTORY_REQUESTS} from '../createHistoryRequestQueue'
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

  it('sends no more than five history requests at a time when many rows mount together', async () => {
    const pending: Array<() => void> = []
    let maxInFlight = 0
    mockGetTransactionsLogs.mockImplementation(
      () =>
        new Promise((resolve) => {
          pending.push(() => resolve([]))
          maxInFlight = Math.max(maxInFlight, pending.length)
        }),
    )
    const wrapper = await createTestProvider()
    const rows = Array.from({length: MAX_CONCURRENT_HISTORY_REQUESTS * 3}, (_unused, index) =>
      renderHook(() => useReleaseHistory(`queued-${index}`, 'rSummer', 'rev-queued'), {wrapper}),
    )

    for (const batch of [1, 2, 3]) {
      await waitFor(() =>
        expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(
          MAX_CONCURRENT_HISTORY_REQUESTS * batch,
        ),
      )
      pending.splice(0).forEach((resolve) => resolve())
    }

    await waitFor(() =>
      expect(rows.every(({result}) => result.current.loading === false)).toBe(true),
    )
    expect(maxInFlight).toBe(MAX_CONCURRENT_HISTORY_REQUESTS)
  })
})
