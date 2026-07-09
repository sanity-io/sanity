import {type SanityClient} from '@sanity/client'
import {renderHook, waitFor} from '@testing-library/react'
import {firstValueFrom, of, Subject, take, toArray} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience, variantNorwegianMarket} from '../../__fixtures__/variants.fixture'
import {type VariantStoreState} from '../../store/reducer'
import {type SystemVariant} from '../../types'
import {
  buildVariantsDocumentCountsQuery,
  getVariantsDocumentCounts,
  useVariantsDocumentCounts,
  type VariantsDocumentCountsState,
} from '../useVariantsDocumentCounts'

const useClientMock = vi.hoisted(() => vi.fn())
const useVariantsStoreMock = vi.hoisted(() => vi.fn())

vi.mock('../../../hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useClient: useClientMock,
}))

vi.mock('../../store/useVariantsStore', () => ({
  useVariantsStore: useVariantsStoreMock,
}))

type ListenerEvent = {
  type: 'welcome' | 'mutation'
  transition?: 'update'
  visibility?: 'query'
}

function createMockClient() {
  const listeners: Subject<ListenerEvent>[] = []
  const fetch = vi.fn()
  const listen = vi.fn(() => {
    const listener$ = new Subject<ListenerEvent>()
    listeners.push(listener$)
    return listener$
  })
  const client = {
    listen,
    observable: {fetch},
    withConfig: vi.fn(() => client),
  } as unknown as SanityClient

  return {client, fetch, listen, listeners}
}

function makeVariantsState(variants: SystemVariant[]): VariantStoreState {
  return {
    variants: new Map(variants.map((variant) => [variant._id, variant])),
    state: 'loaded',
  }
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

    const value = await firstValueFrom(getVariantsDocumentCounts(client, of(makeVariantsState([]))))

    expect(value).toEqual({data: {}, loading: false, error: null})
    expect(fetch).not.toHaveBeenCalled()
    expect(listen).not.toHaveBeenCalled()
  })

  it('opens a single listener and maps the aggregate response to counts per variant id', async () => {
    const {client, fetch, listen, listeners} = createMockClient()
    fetch.mockReturnValue(of({[variantAlphaAudience._id]: 2, [variantNorwegianMarket._id]: 0}))

    const valuesPromise = firstValueFrom(
      getVariantsDocumentCounts(
        client,
        of(makeVariantsState([variantAlphaAudience, variantNorwegianMarket])),
      ).pipe(take(2), toArray()),
    )

    listeners[0]!.next({type: 'welcome'})

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

    const {client, fetch, listeners} = createMockClient()
    fetch
      .mockReturnValueOnce(of({[variantAlphaAudience._id]: 1}))
      .mockReturnValueOnce(of({[variantAlphaAudience._id]: 2}))

    const valuesPromise = firstValueFrom(
      getVariantsDocumentCounts(client, of(makeVariantsState([variantAlphaAudience]))).pipe(
        take(3),
        toArray(),
      ),
    )

    listeners[0]!.next({type: 'welcome'})
    await vi.advanceTimersByTimeAsync(0)
    listeners[0]!.next({type: 'mutation', transition: 'update', visibility: 'query'})
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

  it('switches to a new listener and preserves counts when the variant set changes', async () => {
    const {client, fetch, listen, listeners} = createMockClient()
    const variantsState$ = new Subject<VariantStoreState>()

    fetch
      .mockReturnValueOnce(of({[variantAlphaAudience._id]: 1}))
      .mockReturnValueOnce(of({[variantAlphaAudience._id]: 1, [variantNorwegianMarket._id]: 4}))

    const emissions: VariantsDocumentCountsState[] = []
    const subscription = getVariantsDocumentCounts(client, variantsState$).subscribe((value) =>
      emissions.push(value),
    )

    variantsState$.next(makeVariantsState([variantAlphaAudience]))
    listeners[0]!.next({type: 'welcome'})

    await vi.waitFor(() => {
      expect(emissions.at(-1)).toEqual({
        data: {[variantAlphaAudience._id]: 1},
        loading: false,
        error: null,
      })
    })

    // Adding a variant closes the previous listener and opens a new one covering both
    // variants, inside the same outer subscription.
    variantsState$.next(makeVariantsState([variantAlphaAudience, variantNorwegianMarket]))

    expect(listen).toHaveBeenCalledTimes(2)
    expect(listeners[0]!.observed).toBe(false)
    expect(listen).toHaveBeenLastCalledWith(
      '*[sanity::partOfVariant("alpha-audience") || sanity::partOfVariant("norwegian-market")]',
      {},
      expect.anything(),
    )

    // While the new fetch is pending, the previously fetched counts are preserved.
    expect(emissions.at(-1)).toEqual({
      data: {[variantAlphaAudience._id]: 1},
      loading: false,
      error: null,
    })

    listeners[1]!.next({type: 'welcome'})

    await vi.waitFor(() => {
      expect(emissions.at(-1)).toEqual({
        data: {
          [variantAlphaAudience._id]: 1,
          [variantNorwegianMarket._id]: 4,
        },
        loading: false,
        error: null,
      })
    })

    subscription.unsubscribe()
  })

  it('ignores store emissions that do not change the variant set', () => {
    const {client, fetch, listen, listeners} = createMockClient()
    const variantsState$ = new Subject<VariantStoreState>()

    fetch.mockReturnValue(of({[variantAlphaAudience._id]: 1}))

    const subscription = getVariantsDocumentCounts(client, variantsState$).subscribe()

    variantsState$.next(makeVariantsState([variantAlphaAudience]))
    listeners[0]!.next({type: 'welcome'})
    variantsState$.next(makeVariantsState([{...variantAlphaAudience, priority: 9}]))

    expect(listen).toHaveBeenCalledTimes(1)
    expect(listeners[0]!.observed).toBe(true)

    subscription.unsubscribe()
  })

  it('exposes fetch errors and keeps reacting to variant set changes', async () => {
    const {client, fetch, listeners} = createMockClient()
    const variantsState$ = new Subject<VariantStoreState>()
    const error = new Error('Failed to fetch counts')

    fetch
      .mockImplementationOnce(() => {
        throw error
      })
      .mockReturnValueOnce(of({[variantNorwegianMarket._id]: 4}))

    const emissions: VariantsDocumentCountsState[] = []
    const subscription = getVariantsDocumentCounts(client, variantsState$).subscribe((value) =>
      emissions.push(value),
    )

    variantsState$.next(makeVariantsState([variantAlphaAudience]))
    listeners[0]!.next({type: 'welcome'})

    await vi.waitFor(() => {
      expect(emissions.at(-1)).toEqual({data: null, loading: false, error})
    })

    // The outer stream survives the error: a variant set change starts a new listener.
    variantsState$.next(makeVariantsState([variantNorwegianMarket]))
    listeners[1]!.next({type: 'welcome'})

    await vi.waitFor(() => {
      expect(emissions.at(-1)).toEqual({
        data: {[variantNorwegianMarket._id]: 4},
        loading: false,
        error: null,
      })
    })

    subscription.unsubscribe()
  })
})

describe('useVariantsDocumentCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns live counts for the variants held by the variants store', async () => {
    const {client, fetch, listeners} = createMockClient()
    useClientMock.mockReturnValue(client)
    useVariantsStoreMock.mockReturnValue({
      state$: of(makeVariantsState([variantAlphaAudience])),
      dispatch: vi.fn(),
    })
    fetch.mockReturnValue(of({[variantAlphaAudience._id]: 3}))

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVariantsDocumentCounts(), {wrapper})

    expect(result.current).toEqual({data: null, loading: true, error: null})

    listeners[0]!.next({type: 'welcome'})

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
    useVariantsStoreMock.mockReturnValue({
      state$: of(makeVariantsState([])),
      dispatch: vi.fn(),
    })

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVariantsDocumentCounts(), {wrapper})

    expect(result.current).toEqual({data: {}, loading: false, error: null})
    expect(fetch).not.toHaveBeenCalled()
    expect(listen).not.toHaveBeenCalled()
  })
})
