import {type DatasetsResponse, type SanityClient} from '@sanity/client'
import {act, renderHook} from '@testing-library/react'
import {of, Subject, throwError} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useDatasets} from './useDatasets'

const mockDatasetsList = vi.fn()
const mockClient = {
  observable: {
    datasets: {
      list: mockDatasetsList,
    },
  },
} as unknown as SanityClient

const MOCK_DATASETS: DatasetsResponse = [
  {
    name: 'production',
    aclMode: 'public',
    createdAt: '2017-11-02T14:45:09.221Z',
    createdByUserId: '123',
    addonFor: null,
    datasetProfile: 'content',
    features: [],
    tags: [],
  },
  {
    name: 'staging',
    aclMode: 'public',
    createdAt: '2017-11-02T14:45:09.221Z',
    createdByUserId: '456',
    addonFor: null,
    datasetProfile: 'content',
    features: [],
    tags: [],
  },
  {
    name: 'development',
    aclMode: 'public',
    createdAt: '2017-11-02T14:45:09.221Z',
    createdByUserId: '789',
    addonFor: null,
    datasetProfile: 'content',
    features: [],
    tags: [],
  },
]

describe('useDatasets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should get datasets from client.observable.datasets.list() and resolve with them', async () => {
    mockDatasetsList.mockReturnValue(of(MOCK_DATASETS))

    const {result} = renderHook(() => useDatasets({client: mockClient, datasets: undefined}))

    expect(mockDatasetsList).toHaveBeenCalledTimes(1)
    await expect(result.current).resolves.toEqual(['production', 'staging', 'development'])
  })

  it('should stay pending until the datasets request emits', async () => {
    const datasets$ = new Subject<DatasetsResponse>()
    mockDatasetsList.mockReturnValue(datasets$)

    const {result} = renderHook(() => useDatasets({client: mockClient, datasets: undefined}))

    expect(result.current.status).toBe('pending')

    await act(async () => {
      datasets$.next(MOCK_DATASETS)
    })
    await expect(result.current).resolves.toEqual(['production', 'staging', 'development'])
  })

  it('should resolve with the array directly without calling client when configDatasets is an array', async () => {
    const mockDatasets = [{name: 'production'}, {name: 'staging'}, {name: 'development'}]
    mockDatasetsList.mockReturnValue(of(mockDatasets))
    const configDatasets = ['custom-dataset-1', 'custom-dataset-2']
    const {result} = renderHook(() => useDatasets({client: mockClient, datasets: configDatasets}))

    expect(mockDatasetsList).not.toHaveBeenCalled()
    await expect(result.current).resolves.toEqual(configDatasets)
  })

  it('should call client.observable.datasets.list() and apply callback function when configDatasets is a function', async () => {
    const datasetsCallback = (datasets: DatasetsResponse) =>
      datasets.filter((ds) => ds.name !== 'development')

    mockDatasetsList.mockReturnValue(of(MOCK_DATASETS))
    const {result} = renderHook(() =>
      useDatasets({
        client: mockClient,
        datasets: datasetsCallback,
      }),
    )
    expect(mockDatasetsList).toHaveBeenCalledTimes(1)
    await expect(result.current).resolves.toEqual(['production', 'staging'])
  })

  it('should handle client error and resolve with Error when configDatasets is undefined', async () => {
    const mockError = new Error('Network error')
    mockDatasetsList.mockReturnValue(throwError(() => mockError))

    const {result} = renderHook(() =>
      useDatasets({
        client: mockClient,
        datasets: undefined,
      }),
    )
    expect(mockDatasetsList).toHaveBeenCalledTimes(1)
    await expect(result.current).resolves.toBe(mockError)
  })
  it('should handle client error and resolve with Error even with function config', async () => {
    const mockError = new Error('Network error')
    const datasetsCallback = (datasets: DatasetsResponse) => datasets
    mockDatasetsList.mockReturnValue(throwError(() => mockError))
    const {result} = renderHook(() =>
      useDatasets({
        client: mockClient,
        datasets: datasetsCallback,
      }),
    )
    expect(mockDatasetsList).toHaveBeenCalledTimes(1)
    await expect(result.current).resolves.toBe(mockError)
  })

  // Documents the base branch's no-tear requirement: `datasets$` is memoized
  // on `client` and `VisionContainer` stays mounted across project switches,
  // so the hook must never report the previous client's datasets under the
  // newly selected client. With promise semantics, a client switch yields a
  // new promise (new observable identity) that resolves with the new
  // client's datasets — the stale promise is abandoned.
  it('resolves with the new client datasets when the client changes (no stale tear)', async () => {
    const clientA = {
      observable: {datasets: {list: () => of([{name: 'a-dataset'}] as DatasetsResponse)}},
    } as unknown as SanityClient
    const clientB = {
      observable: {datasets: {list: () => of([{name: 'b-dataset'}] as DatasetsResponse)}},
    } as unknown as SanityClient

    const {result, rerender} = renderHook(
      ({client}: {client: SanityClient}) => useDatasets({client, datasets: undefined}),
      {initialProps: {client: clientA}},
    )
    await expect(result.current).resolves.toEqual(['a-dataset'])

    // Switch client in place (VisionContainer stays mounted). The returned
    // promise must reflect clientB, never the stale clientA datasets.
    rerender({client: clientB})
    await expect(result.current).resolves.toEqual(['b-dataset'])
  })
})
