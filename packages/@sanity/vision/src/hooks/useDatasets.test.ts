import {type DatasetsResponse, type SanityClient} from '@sanity/client'
import {renderHook} from '@testing-library/react'
import {of, throwError} from 'rxjs'
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

  it('should get datasets from client.observable.datasets.list() and return them', async () => {
    mockDatasetsList.mockReturnValue(of(MOCK_DATASETS))

    const {result} = renderHook(() => useDatasets({client: mockClient, datasets: undefined}))

    expect(mockDatasetsList).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(['production', 'staging', 'development'])
  })

  it('should return the array directly without calling client when configDatasets is an array', () => {
    const mockDatasets = [{name: 'production'}, {name: 'staging'}, {name: 'development'}]
    mockDatasetsList.mockReturnValue(of(mockDatasets))
    const configDatasets = ['custom-dataset-1', 'custom-dataset-2']
    const {result} = renderHook(() => useDatasets({client: mockClient, datasets: configDatasets}))

    expect(mockDatasetsList).not.toHaveBeenCalled()
    expect(result.current).toEqual(configDatasets)
  })

  it('should call client.observable.datasets.list() and apply callback function when configDatasets is a function', () => {
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
    expect(result.current).toEqual(['production', 'staging'])
  })

  it('should handle client error and return Error when configDatasets is undefined', async () => {
    const mockError = new Error('Network error')
    mockDatasetsList.mockReturnValue(throwError(() => mockError))

    const {result} = renderHook(() =>
      useDatasets({
        client: mockClient,
        datasets: undefined,
      }),
    )
    expect(mockDatasetsList).toHaveBeenCalledTimes(1)
    expect(result.current).toBe(mockError)
  })
  it('should handle client error and return Error even with function config', () => {
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
    expect(result.current).toBe(mockError)
  })
})
