import {type SanityClient} from '@sanity/client'
import {renderHook, waitFor} from '@testing-library/react'
import {firstValueFrom, of, Subject, take, toArray} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience, variantNorwegianMarket} from '../../__fixtures__/variants.fixture'
import {
  buildVariantsDocumentCountsQuery,
  getVariantsDocumentCounts,
  useVariantsDocumentCounts,
} from '../useVariantsDocumentCounts'

const useClientMock = vi.hoisted(() => vi.fn())

vi.mock('../../../hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useClient: useClientMock,
}))

function createMockClient() {
  const listener$ = new Subject<{
    type: 'welcome' | 'mutation'
    transition?: 'update'
    visibility?: 'query'
  }>()
  const fetch = vi.fn()
  const listen = vi.fn(() => listener$)
  const client = {
    listen,
    observable: {fetch},
    withConfig: vi.fn(() => client),
  } as unknown as SanityClient

  return {client, fetch, listen, listener$}
}

describe('buildVariantsDocumentCountsQuery', () => {
  it('builds one aggregate fetch query and one listen filter covering all variants', () => {
    const {fetch, listen} = buildVariantsDocumentCountsQuery([
      variantAlphaAudience._id,
      variantNorwegianMarket._id,
    ])

    expect(fetch).toBe(
      '{' +
        '"_.variants.alpha-audience": count(array::unique(*[sanity::partOfVariant("alpha-audience")]._system.group._ref)),' +
        '"_.variants.norwegian-market": count(array::unique(*[sanity::partOfVariant("norwegian-market")]._system.group._ref))' +
        '}',
    )
    expect(listen).toBe(
      '*[sanity::partOfVariant("alpha-audience") || sanity::partOfVariant("norwegian-market")]',
    )
  })
})

describe('getVariantsDocumentCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits empty data without fetching or listening when there are no variants', async () => {
    const {client, fetch, listen} = createMockClient()

    const value = await firstValueFrom(getVariantsDocumentCounts(client, []))

    expect(value).toEqual({data: {}, loading: false, error: null})
    expect(fetch).not.toHaveBeenCalled()
    expect(listen).not.toHaveBeenCalled()
  })

  it('opens a single listener and maps the aggregate response to counts per variant id', async () => {
    const {client, fetch, listen, listener$} = createMockClient()
    fetch.mockReturnValue(of({[variantAlphaAudience._id]: 2, [variantNorwegianMarket._id]: 0}))

    const valuesPromise = firstValueFrom(
      getVariantsDocumentCounts(client, [
        variantAlphaAudience._id,
        variantNorwegianMarket._id,
      ]).pipe(take(2), toArray()),
    )

    listener$.next({type: 'welcome'})

    const values = await valuesPromise

    expect(listen).toHaveBeenCalledTimes(1)
    expect(listen).toHaveBeenCalledWith(
      '*[sanity::partOfVariant("alpha-audience") || sanity::partOfVariant("norwegian-market")]',
      {},
      expect.objectContaining({
        events: ['welcome', 'mutation', 'reconnect'],
        includeAllVersions: true,
        includeResult: false,
        visibility: 'query',
        tag: 'variants-doc-counts.listen',
      }),
    )
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('count(array::unique('),
      {},
      expect.objectContaining({tag: 'variants-doc-counts.listen', perspective: 'raw'}),
    )
    expect(values[0]).toEqual({data: null, loading: true, error: null})
    expect(values[1]).toEqual({
      data: {
        [variantAlphaAudience._id]: 2,
        [variantNorwegianMarket._id]: 0,
      },
      loading: false,
      error: null,
    })
  })

  it('refetches counts when the listener emits a mutation', async () => {
    vi.useFakeTimers()

    const {client, fetch, listener$} = createMockClient()
    fetch
      .mockReturnValueOnce(of({[variantAlphaAudience._id]: 1}))
      .mockReturnValueOnce(of({[variantAlphaAudience._id]: 2}))

    const valuesPromise = firstValueFrom(
      getVariantsDocumentCounts(client, [variantAlphaAudience._id]).pipe(take(3), toArray()),
    )

    listener$.next({type: 'welcome'})
    await vi.advanceTimersByTimeAsync(0)
    listener$.next({type: 'mutation', transition: 'update', visibility: 'query'})
    await vi.advanceTimersByTimeAsync(1000)

    const values = await valuesPromise
    vi.useRealTimers()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(values.at(-1)).toEqual({
      data: {[variantAlphaAudience._id]: 2},
      loading: false,
      error: null,
    })
  })

  it('exposes fetch errors', async () => {
    const {client, fetch, listener$} = createMockClient()
    const error = new Error('Failed to fetch counts')
    fetch.mockImplementation(() => {
      throw error
    })

    const valuesPromise = firstValueFrom(
      getVariantsDocumentCounts(client, [variantAlphaAudience._id]).pipe(take(2), toArray()),
    )

    listener$.next({type: 'welcome'})

    const values = await valuesPromise

    expect(values.at(-1)).toEqual({data: null, loading: false, error})
  })
})

describe('useVariantsDocumentCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns live counts and stops loading after the first fetch', async () => {
    const {client, fetch, listener$} = createMockClient()
    useClientMock.mockReturnValue(client)
    fetch.mockReturnValue(of({[variantAlphaAudience._id]: 3}))

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVariantsDocumentCounts([variantAlphaAudience._id]), {
      wrapper,
    })

    expect(result.current).toEqual({data: null, loading: true, error: null})

    listener$.next({type: 'welcome'})

    await waitFor(() => {
      expect(result.current).toEqual({
        data: {[variantAlphaAudience._id]: 3},
        loading: false,
        error: null,
      })
    })
  })

  it('returns empty data without a listener when there are no variants', async () => {
    const {client, fetch, listen} = createMockClient()
    useClientMock.mockReturnValue(client)

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVariantsDocumentCounts([]), {wrapper})

    expect(result.current).toEqual({data: {}, loading: false, error: null})
    expect(fetch).not.toHaveBeenCalled()
    expect(listen).not.toHaveBeenCalled()
  })
})
