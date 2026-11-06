import {type SanityClient} from '@sanity/client'
import {renderHook, waitFor} from '@testing-library/react'
import {defer, firstValueFrom, type Observable, of, Subject, take, toArray} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {createDocumentPreviewStore} from '../../../preview/documentPreviewStore'
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

vi.mock('../../../hooks/useClient', async (importOriginal) => ({
  ...(await importOriginal()),
  useClient: useClientMock,
}))

vi.mock('../../store/useVariantsStore', () => ({
  useVariantsStore: useVariantsStoreMock,
}))

type ListenerEvent =
  | {type: 'welcome'}
  | {type: 'mutation'; documentId: string; transition: 'update'; visibility: 'query'}

function createMockClient() {
  const listener$ = new Subject<ListenerEvent>()
  /** The query of every listener connection opened, in order */
  const connections: string[] = []
  const fetch = vi.fn()
  const client = {
    listen: (query: string) =>
      defer(() => {
        connections.push(query)
        return listener$
      }),
    observable: {fetch},
    withConfig: () => client,
  } as unknown as SanityClient

  return {client, fetch, connections, listener$}
}

function mutation(documentId: string): ListenerEvent {
  return {type: 'mutation', documentId, transition: 'update', visibility: 'query'}
}

/** The counts of the variants in `variantsState$`, following a real preview store's global listener */
function observeCounts(client: SanityClient, variantsState$: Observable<VariantStoreState>) {
  const previewStore = createDocumentPreviewStore({client})
  return getVariantsDocumentCounts(
    client,
    previewStore.unstable_invalidationChannel,
    variantsState$,
  )
}

async function flushScheduled() {
  // exhaustMapWithTrailing schedules work on RxJS asyncScheduler (setInterval(0)).
  // Fake timers only flush that work once the clock moves.
  await vi.advanceTimersByTimeAsync(1)
}

function makeVariantsState(variants: SystemVariant[]): VariantStoreState {
  return {
    variants: new Map(variants.map((variant) => [variant._id, variant])),
    state: 'loaded',
  }
}

describe('buildVariantsDocumentCountsQuery', () => {
  it('builds one aggregate count query covering all variants', () => {
    expect(
      buildVariantsDocumentCountsQuery([variantAlphaAudience._id, variantNorwegianMarket._id]),
    ).toBe(
      '{' +
        '"_.variants.alpha-audience": count(array::unique(*[sanity::partOfVariant("alpha-audience")]._system.group._ref)),' +
        '"_.variants.norwegian-market": count(array::unique(*[sanity::partOfVariant("norwegian-market")]._system.group._ref))' +
        '}',
    )
  })
})

describe('getVariantsDocumentCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits empty data without fetching or listening when there are no variants', async () => {
    const {client, fetch, connections} = createMockClient()

    const value = await firstValueFrom(observeCounts(client, of(makeVariantsState([]))))

    expect(value).toEqual({data: {}, loading: false, error: null})
    expect(fetch).not.toHaveBeenCalled()
    expect(connections).toEqual([])
  })

  it('fetches once the global listener connects, and maps the aggregate response to counts per variant id', async () => {
    const {client, fetch, connections, listener$} = createMockClient()
    fetch.mockReturnValue(of({[variantAlphaAudience._id]: 2, [variantNorwegianMarket._id]: 0}))

    const valuesPromise = firstValueFrom(
      observeCounts(
        client,
        of(makeVariantsState([variantAlphaAudience, variantNorwegianMarket])),
      ).pipe(take(2), toArray()),
    )

    listener$.next({type: 'welcome'})

    const values = await valuesPromise

    expect(connections).toEqual(['*'])
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('count(array::unique('),
      {},
      expect.objectContaining({tag: 'variants-doc-counts.fetch', perspective: 'raw'}),
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

  it('refetches the counts when a version document changes, and ignores other documents', async () => {
    vi.useFakeTimers()

    const {client, fetch, listener$} = createMockClient()
    fetch
      .mockReturnValueOnce(of({[variantAlphaAudience._id]: 1}))
      .mockReturnValueOnce(of({[variantAlphaAudience._id]: 2}))

    const emissions: VariantsDocumentCountsState[] = []
    const subscription = observeCounts(
      client,
      of(makeVariantsState([variantAlphaAudience])),
    ).subscribe((value) => emissions.push(value))

    listener$.next({type: 'welcome'})
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(1)

    // Published documents, drafts and variant definitions are never in a variant
    listener$.next(mutation('article'))
    listener$.next(mutation('drafts.article'))
    listener$.next(mutation(variantAlphaAudience._id))
    await vi.advanceTimersByTimeAsync(2000)
    expect(fetch).toHaveBeenCalledTimes(1)

    listener$.next(mutation('versions.scope-alpha.article'))
    await flushScheduled()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(emissions.at(-1)).toEqual({
      data: {[variantAlphaAudience._id]: 2},
      loading: false,
      error: null,
    })

    subscription.unsubscribe()
  })

  it('fetches the counts of a new variant set on the same connection, and preserves the counts meanwhile', async () => {
    const {client, fetch, connections, listener$} = createMockClient()
    const variantsState$ = new Subject<VariantStoreState>()

    fetch
      .mockReturnValueOnce(of({[variantAlphaAudience._id]: 1}))
      .mockReturnValueOnce(of({[variantAlphaAudience._id]: 1, [variantNorwegianMarket._id]: 4}))

    const emissions: VariantsDocumentCountsState[] = []
    const subscription = observeCounts(client, variantsState$).subscribe((value) =>
      emissions.push(value),
    )

    variantsState$.next(makeVariantsState([variantAlphaAudience]))
    listener$.next({type: 'welcome'})

    await vi.waitFor(() => {
      expect(emissions.at(-1)).toEqual({
        data: {[variantAlphaAudience._id]: 1},
        loading: false,
        error: null,
      })
    })

    variantsState$.next(makeVariantsState([variantAlphaAudience, variantNorwegianMarket]))

    // While the new fetch is pending, the previously fetched counts are preserved.
    expect(emissions.at(-1)).toEqual({
      data: {[variantAlphaAudience._id]: 1},
      loading: false,
      error: null,
    })

    // The global listener is still connected, so the counts of the new set are fetched without
    // waiting for it to connect again.
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
    expect(fetch).toHaveBeenLastCalledWith(
      buildVariantsDocumentCountsQuery([variantAlphaAudience._id, variantNorwegianMarket._id]),
      {},
      expect.anything(),
    )
    expect(connections).toEqual(['*'])

    subscription.unsubscribe()
  })

  it('ignores store emissions that do not change the variant set', async () => {
    vi.useFakeTimers()

    const {client, fetch, listener$} = createMockClient()
    const variantsState$ = new Subject<VariantStoreState>()

    fetch.mockReturnValue(of({[variantAlphaAudience._id]: 1}))

    const subscription = observeCounts(client, variantsState$).subscribe()

    variantsState$.next(makeVariantsState([variantAlphaAudience]))
    listener$.next({type: 'welcome'})
    await flushScheduled()
    variantsState$.next(makeVariantsState([{...variantAlphaAudience, priority: 9}]))
    await vi.advanceTimersByTimeAsync(2000)

    expect(fetch).toHaveBeenCalledTimes(1)

    subscription.unsubscribe()
  })

  it('exposes fetch errors and keeps reacting to variant set changes', async () => {
    const {client, fetch, listener$} = createMockClient()
    const variantsState$ = new Subject<VariantStoreState>()
    const error = new Error('Failed to fetch counts')

    fetch
      .mockImplementationOnce(() => {
        throw error
      })
      .mockReturnValueOnce(of({[variantNorwegianMarket._id]: 4}))

    const emissions: VariantsDocumentCountsState[] = []
    const subscription = observeCounts(client, variantsState$).subscribe((value) =>
      emissions.push(value),
    )

    variantsState$.next(makeVariantsState([variantAlphaAudience]))
    listener$.next({type: 'welcome'})

    await vi.waitFor(() => {
      expect(emissions.at(-1)).toEqual({data: null, loading: false, error})
    })

    // The outer stream survives the error: a variant set change fetches the counts of the new set.
    variantsState$.next(makeVariantsState([variantNorwegianMarket]))

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
    const {client, fetch, listener$} = createMockClient()
    useClientMock.mockReturnValue(client)
    useVariantsStoreMock.mockReturnValue({
      state$: of(makeVariantsState([variantAlphaAudience])),
      dispatch: vi.fn(),
    })
    fetch.mockReturnValue(of({[variantAlphaAudience._id]: 3}))

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVariantsDocumentCounts(), {wrapper})

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
    const {client, fetch, connections} = createMockClient()
    useClientMock.mockReturnValue(client)
    useVariantsStoreMock.mockReturnValue({
      state$: of(makeVariantsState([])),
      dispatch: vi.fn(),
    })

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useVariantsDocumentCounts(), {wrapper})

    expect(result.current).toEqual({data: {}, loading: false, error: null})
    expect(fetch).not.toHaveBeenCalled()
    expect(connections).toEqual([])
  })
})
