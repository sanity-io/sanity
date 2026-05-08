import {type SanityClient} from '@sanity/client'
import {filter, firstValueFrom, of, Subject, take, throwError, toArray} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createVariantsStore} from '../createVariantsStore'
import {createVariant} from './testUtils'

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
  } as unknown as SanityClient

  return {client, fetch, listen, listener$}
}

describe('createVariantsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads variants from the variants system document path', async () => {
    const variant = createVariant('a')
    const {client, fetch, listen, listener$} = createMockClient()
    fetch.mockReturnValue(of([variant]))

    const store = createVariantsStore({client})
    const valuesPromise = firstValueFrom(store.state$.pipe(take(4), toArray()))

    listener$.next({type: 'welcome'})

    const values = await valuesPromise
    const fetchQuery = fetch.mock.calls[0][0] as string

    expect(fetchQuery).toContain('_type=="system.variant"')
    expect(fetchQuery).toContain('_id in path("_.variants.*")')
    expect(fetchQuery).toContain('_createdAt')
    expect(fetchQuery).toContain('"priority": coalesce(priority, 0)')
    expect(fetchQuery).toContain('| order(_createdAt desc)')
    expect(fetch).toHaveBeenCalledWith(
      fetchQuery,
      {},
      expect.objectContaining({filterResponse: true, tag: 'variants.listen'}),
    )
    expect(listen).toHaveBeenCalledWith(
      fetchQuery,
      {},
      expect.objectContaining({
        events: ['welcome', 'mutation', 'reconnect'],
        includeAllVersions: true,
        tag: 'variants.listen',
        visibility: 'query',
      }),
    )
    expect(values[0]).toMatchObject({state: 'initialising'})
    expect(values[1]).toMatchObject({state: 'loading'})
    expect(values[3]).toMatchObject({state: 'loaded', error: undefined})
    expect(Array.from(values[3].variants.values())).toEqual([variant])
  })

  it('keeps variants updated when the listener refetches', async () => {
    const firstVariant = createVariant('a')
    const updatedVariant = createVariant('b', 1)
    const {client, fetch, listener$} = createMockClient()
    fetch.mockReturnValueOnce(of([firstVariant])).mockReturnValueOnce(of([updatedVariant]))

    const store = createVariantsStore({client})
    const valuesPromise = firstValueFrom(store.state$.pipe(take(6), toArray()))

    listener$.next({type: 'welcome'})
    listener$.next({type: 'mutation', transition: 'update', visibility: 'query'})

    const values = await valuesPromise
    const lastValue = values.at(-1)!

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(lastValue.state).toBe('loaded')
    expect(Array.from(lastValue.variants.values())).toEqual([updatedVariant])
  })

  it('supports removing a variant through dispatch', async () => {
    const variantA = createVariant('a')
    const variantB = createVariant('b', 1)
    const {client, fetch, listener$} = createMockClient()
    fetch.mockReturnValue(of([variantA, variantB]))

    const store = createVariantsStore({client})
    const loadedPromise = firstValueFrom(
      store.state$.pipe(
        filter(({state, variants}) => state === 'loaded' && variants.size === 2),
        take(1),
      ),
    )

    listener$.next({type: 'welcome'})
    await loadedPromise

    const deletedPromise = firstValueFrom(
      store.state$.pipe(
        filter(({variants}) => variants.size === 1 && variants.has(variantB._id)),
        take(1),
      ),
    )

    store.dispatch({type: 'VARIANT_DELETED', payload: {id: variantA._id}})

    const deletedState = await deletedPromise

    expect(Array.from(deletedState.variants.values())).toEqual([variantB])
  })

  it('exposes listener errors in the store state', async () => {
    const error = new Error('Failed to fetch variants')
    const {client, fetch, listener$} = createMockClient()
    fetch.mockReturnValue(throwError(() => error))

    const store = createVariantsStore({client})
    const valuesPromise = firstValueFrom(store.state$.pipe(take(3), toArray()))

    listener$.next({type: 'welcome'})

    const values = await valuesPromise
    const lastValue = values.at(-1)!

    expect(lastValue).toMatchObject({state: 'error', error})
  })
})
