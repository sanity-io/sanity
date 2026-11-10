import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {concat, firstValueFrom, NEVER, type Observable, of, Subject} from 'rxjs'
import {createSearch, type SearchSort} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {listenSearchQuery, resolveSearchOrdering, type SearchQueryState} from '../listenSearchQuery'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  compileFieldPath: vi.fn(),
  createSearch: vi.fn(() => vi.fn(() => of({hits: []}))),
  getSearchableTypes: vi.fn(() => [{name: 'author'}]),
}))

const mockCreateSearch = vi.mocked(createSearch)

const CONFIGURED_SORT: SearchSort[] = [{field: '_updatedAt', direction: 'desc'}]

describe('resolveSearchOrdering', () => {
  it('keeps the configured order and skips score sorting when there is no search term', () => {
    expect(
      resolveSearchOrdering({searchQuery: '', sortBy: CONFIGURED_SORT, searchStrategy: 'groq2024'}),
    ).toEqual({skipSortByScore: true, sort: CONFIGURED_SORT})
  })

  it('ranks by relevance (groq2024) by prepending a _score sort entry, keeping the configured order as a tiebreaker', () => {
    expect(
      resolveSearchOrdering({
        searchQuery: 'exodus',
        sortBy: CONFIGURED_SORT,
        searchStrategy: 'groq2024',
      }),
    ).toEqual({
      skipSortByScore: false,
      sort: [
        {field: '_score', direction: 'desc'},
        {field: '_updatedAt', direction: 'desc'},
      ],
    })
  })

  it('defaults to groq2024 relevance behaviour when no strategy is provided', () => {
    expect(resolveSearchOrdering({searchQuery: 'exodus', sortBy: CONFIGURED_SORT})).toEqual({
      skipSortByScore: false,
      sort: [
        {field: '_score', direction: 'desc'},
        {field: '_updatedAt', direction: 'desc'},
      ],
    })
  })

  it('ranks by relevance (groqLegacy) via client-side score sorting without injecting a _score field', () => {
    expect(
      resolveSearchOrdering({
        searchQuery: 'exodus',
        sortBy: CONFIGURED_SORT,
        searchStrategy: 'groqLegacy',
      }),
    ).toEqual({skipSortByScore: false, sort: CONFIGURED_SORT})
  })

  it('keeps the chosen order and skips scoring when relevance is disabled, even with a search term', () => {
    const chosenSort: SearchSort[] = [{field: 'title', direction: 'asc'}]
    expect(
      resolveSearchOrdering({
        searchQuery: 'exodus',
        sortBy: chosenSort,
        searchStrategy: 'groq2024',
        useRelevance: false,
      }),
    ).toEqual({skipSortByScore: true, sort: chosenSort})
  })
})

describe('listenSearchQuery', () => {
  function runListenSearchQuery(variant?: string) {
    const client = {
      listen: vi.fn(() => of({type: 'welcome'})),
      observable: {fetch: vi.fn(() => of(['author']))},
    } as unknown as SanityClient

    return firstValueFrom(
      listenSearchQuery({
        client,
        filter: '_type == "author"',
        limit: 25,
        params: {},
        schema: {} as Schema,
        searchQuery: '',
        sort: {by: [{field: '_updatedAt', direction: 'desc'}]},
        staticTypeNames: ['author'],
        perspective: ['drafts'],
        variant,
      }),
    )
  }

  it('searches within the selected variant', async () => {
    mockCreateSearch.mockClear()
    const search = vi.fn(() => of({hits: []}))
    mockCreateSearch.mockReturnValue(search as never)

    await runListenSearchQuery('alpha-audience')

    expect(mockCreateSearch).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({variant: 'alpha-audience'}),
    )
    expect(search).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({perspective: ['drafts'], variant: 'alpha-audience'}),
    )
  })

  it('omits the variant when none is selected', async () => {
    mockCreateSearch.mockClear()
    const search = vi.fn(() => of({hits: []}))
    mockCreateSearch.mockReturnValue(search as never)

    await runListenSearchQuery()

    expect(search).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({variant: undefined}),
    )
  })

  describe('while the list listener is down', () => {
    const book = {_id: 'book-1', _type: 'book'}

    // Each test lists its own type: the list caches its last result per query across calls.
    function listBooks(listen: () => Observable<unknown>, typeName: string) {
      const search = vi.fn(() => of({hits: [{hit: book}]}))
      mockCreateSearch.mockReturnValue(search as never)
      const client = {
        listen: vi.fn(listen),
        observable: {fetch: vi.fn(() => of([typeName]))},
      } as unknown as SanityClient
      const states$ = listenSearchQuery({
        client,
        filter: `_type == "${typeName}"`,
        limit: 25,
        params: {},
        schema: {} as Schema,
        searchQuery: '',
        sort: {by: [{field: '_updatedAt', direction: 'desc'}]},
        staticTypeNames: [typeName],
      })
      return {client, search, states$}
    }

    // The client emits `reconnect` before `welcome` when the listen request fails, and keeps
    // retrying it on its own.
    it.fails('lists the documents the search finds', async () => {
      const {states$} = listBooks(() => concat(of({type: 'reconnect'}), NEVER), 'bookUnreachable')

      expect(await firstValueFrom(states$)).toEqual({
        connected: false,
        fromCache: false,
        documents: [book],
      })
    })
  })
})

describe('listenSearchQuery before welcome', () => {
  type ListenerEvent = {type: 'welcome'} | {type: 'reconnect'} | {type: 'mutation'}

  let listener$: Subject<ListenerEvent>
  let filterCounter = 0

  beforeEach(() => {
    vi.useFakeTimers()
    listener$ = new Subject<ListenerEvent>()
    mockCreateSearch.mockReturnValue(
      vi.fn(() => of({hits: [{hit: {_id: 'a', _type: 'author'}}]})) as never,
    )
  })

  afterEach(() => {
    listener$.complete()
    vi.useRealTimers()
  })

  // The SWR cache is shared by every call, so each test listens with its own filter.
  function uniqueFilter() {
    filterCounter += 1
    return `_type == "author" && $n == ${filterCounter}`
  }

  function subscribe(groqFilter: string) {
    const client = {
      listen: vi.fn(() => listener$),
      observable: {fetch: vi.fn(() => of(['author']))},
    } as unknown as SanityClient

    const values: SearchQueryState[] = []
    const errors: unknown[] = []
    const subscription = listenSearchQuery({
      client,
      filter: groqFilter,
      limit: 25,
      params: {},
      schema: {} as Schema,
      searchQuery: '',
      sort: {by: [{field: '_updatedAt', direction: 'desc'}]},
      staticTypeNames: ['author'],
    }).subscribe({next: (value) => values.push(value), error: (error) => errors.push(error)})

    return {values, errors, subscription}
  }

  it('keeps waiting for welcome when the listener reconnects before it', async () => {
    const {values, errors, subscription} = subscribe(uniqueFilter())

    listener$.next({type: 'reconnect'})
    await vi.advanceTimersByTimeAsync(2000)

    expect(errors).toEqual([])
    expect(values).toEqual([])

    listener$.next({type: 'welcome'})
    await vi.advanceTimersByTimeAsync(1)

    expect(errors).toEqual([])
    expect(values).toEqual([
      {connected: true, fromCache: false, documents: [{_id: 'a', _type: 'author'}]},
    ])

    subscription.unsubscribe()
  })

  it('keeps the cached documents while the listener reconnects before welcome', async () => {
    const groqFilter = uniqueFilter()
    const first = subscribe(groqFilter)
    listener$.next({type: 'welcome'})
    await vi.advanceTimersByTimeAsync(1)
    first.subscription.unsubscribe()

    const {values, errors, subscription} = subscribe(groqFilter)
    listener$.next({type: 'reconnect'})
    await vi.advanceTimersByTimeAsync(2000)

    expect(errors).toEqual([])
    expect(values).toEqual([
      {connected: true, fromCache: true, documents: [{_id: 'a', _type: 'author'}]},
    ])

    subscription.unsubscribe()
  })

  it('errors when no welcome arrives within 30 seconds', async () => {
    const {errors, subscription} = subscribe(uniqueFilter())

    // Reconnects while waiting do not restart the timeout
    await vi.advanceTimersByTimeAsync(15_000)
    listener$.next({type: 'reconnect'})
    await vi.advanceTimersByTimeAsync(14_999)
    expect(errors).toEqual([])

    await vi.advanceTimersByTimeAsync(1)
    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).name).toBe('TimeoutError')
    expect((errors[0] as Error).message).toBe(
      'Timed out after 30000ms waiting for the listener to connect',
    )

    subscription.unsubscribe()
  })

  it('does not time out once welcome has arrived', async () => {
    const {errors, subscription} = subscribe(uniqueFilter())

    await vi.advanceTimersByTimeAsync(29_000)
    listener$.next({type: 'welcome'})
    await vi.advanceTimersByTimeAsync(60_000)

    expect(errors).toEqual([])

    subscription.unsubscribe()
  })

  it('errors when the first event after reconnects is not welcome', async () => {
    const {errors, subscription} = subscribe(uniqueFilter())

    listener$.next({type: 'reconnect'})
    await vi.advanceTimersByTimeAsync(1)
    listener$.next({type: 'mutation'})
    await vi.advanceTimersByTimeAsync(1)

    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toBe('Received unexpected type of first event "mutation"')

    subscription.unsubscribe()
  })
})
