import {type SanityClient} from '@sanity/client'
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

describe('useDatasets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should get datasets from client.observable.datasets.list() and return them', async () => {
    const mockDatasets = [{name: 'production'}, {name: 'staging'}, {name: 'development'}]
    mockDatasetsList.mockReturnValue(of(mockDatasets))

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
    const mockDatasets = [
      {name: 'production'},
      {name: 'staging'},
      {name: 'development'},
      {name: 'test'},
    ]
    const configDatasets = (datasets: string[]) => datasets.filter((ds) => ds !== 'test')
    mockDatasetsList.mockReturnValue(of(mockDatasets))
    const {result} = renderHook(() =>
      useDatasets({
        client: mockClient,
        datasets: configDatasets,
      }),
    )
    expect(mockDatasetsList).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(['production', 'staging', 'development'])
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
    const configDatasets = (datasets: string[]) => datasets
    mockDatasetsList.mockReturnValue(throwError(() => mockError))
    const {result} = renderHook(() =>
      useDatasets({
        client: mockClient,
        datasets: configDatasets,
      }),
    )
    expect(mockDatasetsList).toHaveBeenCalledTimes(1)
    expect(result.current).toBe(mockError)
  })
})
