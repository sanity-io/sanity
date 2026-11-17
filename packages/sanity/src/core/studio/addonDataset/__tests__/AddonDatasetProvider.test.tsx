import {ClientError, type SanityClient} from '@sanity/client'
import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {AddonDatasetProvider} from '../AddonDatasetProvider'
import {type AddonDatasetContextValue} from '../types'
import {useAddonDataset} from '../useAddonDataset'

const {mockRequest} = vi.hoisted(() => ({
  mockRequest: vi.fn<(options: {url: string; method?: string}) => Promise<unknown>>(),
}))

vi.mock('../../workspace', () => ({
  useWorkspace: () => ({dataset: 'production', projectId: 'test-project'}),
}))
vi.mock('../../../hooks/useClient', () => {
  const client = {
    request: mockRequest,
    withConfig: (config: {dataset: string}) => ({config: () => config}),
  }
  return {useClient: () => client}
})

const LIST_URL = '/projects/test-project/datasets?datasetProfile=comments&addonFor=production'
const SETUP_URL = '/comments/production/setup'
const ADDON_DATASET = 'production-comments'

function setupError(statusCode: number, error: string, message: string): ClientError {
  return new ClientError({
    body: {statusCode, error, message},
    headers: {},
    method: 'POST',
    statusCode,
    url: `https://test-project.api.sanity.io/v2025-02-19${SETUP_URL}`,
  })
}

const LIMIT_ERROR = setupError(
  400,
  'Bad Request',
  'Bad Request - Number of datasets with dataset profile "comments" for dataset "production" would exceed the limit of 1',
)

/**
 * Answers the setup with `setup`, and the requests for the list of add-on datasets with the entries
 * of `listed` in turn, repeating the last one.
 */
function respondWith({listed, setup}: {listed: string[][]; setup: () => Promise<unknown>}) {
  let listRequests = 0
  mockRequest.mockImplementation(({url}) => {
    if (url === SETUP_URL) return setup()
    if (url !== LIST_URL) return Promise.reject(new Error(`Unexpected request to ${url}`))
    const names = listed[Math.min(listRequests++, listed.length - 1)]
    return Promise.resolve(names.map((name) => ({name})))
  })
}

function countListRequests(): number {
  return mockRequest.mock.calls.filter(([{url}]) => url === LIST_URL).length
}

async function renderReadyProvider() {
  const {result} = renderHook(() => useAddonDataset(), {wrapper: AddonDatasetProvider})
  await act(() => vi.advanceTimersByTimeAsync(0))
  expect(result.current.ready).toBe(true)
  return {result}
}

/** Starts `createAddonDataset` in `act`, as it updates state before it awaits anything. */
function startCreatingAddonDataset(
  context: AddonDatasetContextValue,
): Promise<SanityClient | null> {
  let creation = Promise.resolve<SanityClient | null>(null)
  act(() => {
    creation = context.createAddonDataset()
  })
  return creation
}

describe('AddonDatasetProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createAddonDataset', () => {
    it('uses the add-on dataset that its setup creates', async () => {
      respondWith({listed: [[]], setup: () => Promise.resolve({datasetName: ADDON_DATASET})})
      const {result} = await renderReadyProvider()

      const creation = startCreatingAddonDataset(result.current)
      await act(() => vi.advanceTimersByTimeAsync(0))
      const client = await creation

      expect(client?.config().dataset).toBe(ADDON_DATASET)
      expect(result.current.client).toBe(client)
      expect(result.current.isCreatingDataset).toBe(false)
    })

    it('waits for the add-on dataset of a setup that runs at the same time to be listed', async () => {
      respondWith({
        // On mount, before the setup, and while the setup that was let through is still running
        listed: [[], [], [], [ADDON_DATASET]],
        setup: () => Promise.reject(LIMIT_ERROR),
      })
      const {result} = await renderReadyProvider()

      const creation = startCreatingAddonDataset(result.current)
      await act(() => vi.advanceTimersByTimeAsync(1_000))
      expect(result.current.isCreatingDataset).toBe(true)
      expect(result.current.client).toBeNull()

      await act(() => vi.advanceTimersByTimeAsync(1_000))
      const client = await creation

      expect(client?.config().dataset).toBe(ADDON_DATASET)
      expect(result.current.client).toBe(client)
      expect(result.current.isCreatingDataset).toBe(false)
    })

    it('fails with the setup error when the add-on dataset never gets listed', async () => {
      respondWith({listed: [[]], setup: () => Promise.reject(LIMIT_ERROR)})
      const {result} = await renderReadyProvider()

      const rejected = expect(startCreatingAddonDataset(result.current)).rejects.toBe(LIMIT_ERROR)
      await act(() => vi.advanceTimersByTimeAsync(60_000))
      await rejected

      expect(result.current.client).toBeNull()
      expect(result.current.isCreatingDataset).toBe(false)
      const requests = mockRequest.mock.calls.length
      await act(() => vi.advanceTimersByTimeAsync(60_000))
      expect(mockRequest).toHaveBeenCalledTimes(requests)
    })

    it.each([
      ['a 400 for another reason', setupError(400, 'Bad Request', 'Bad Request - Invalid dataset')],
      ['a 403', setupError(403, 'Forbidden', 'Forbidden - Missing permissions')],
    ])('fails right away when the setup is rejected with %s', async (_, error) => {
      respondWith({listed: [[]], setup: () => Promise.reject(error)})
      const {result} = await renderReadyProvider()

      const rejected = expect(startCreatingAddonDataset(result.current)).rejects.toBe(error)
      await act(() => vi.advanceTimersByTimeAsync(0))
      await rejected

      // The check on mount and the one before the setup
      expect(countListRequests()).toBe(2)
      expect(result.current.isCreatingDataset).toBe(false)
    })
  })
})
