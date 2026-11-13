import {ChannelError, type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {concat, defer, firstValueFrom, NEVER, type Observable, of, Subject} from 'rxjs'
import {createSearch, type SearchSort} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, onTestFinished, vi} from 'vitest'

import {listenSearchQuery, resolveSearchOrdering, type SearchQueryState} from '../listenSearchQuery'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  compileFieldPath: vi.fn(),
  createSearch: vi.fn(() => vi.fn(() => of({hits: []}))),
  getSearchableTypes: vi.fn(() => [{name: 'author'}]),
}))

const mockCreateSearch = vi.mocked(createSearch)

const CONFIGURED_SORT: SearchSort[] = [{field: '_updatedAt', direction: 'desc'}]

function subscribeToStates(states$: Observable<SearchQueryState>) {
  const states: SearchQueryState[] = []
  const subscription = states$.subscribe((state) => states.push(state))
  onTestFinished(() => subscription.unsubscribe())
  return states
}

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
    it('lists the documents the search finds', async () => {
      const {states$} = listBooks(() => concat(of({type: 'reconnect'}), NEVER), 'bookUnreachable')

      expect(await firstValueFrom(states$)).toEqual({
        connected: false,
        fromCache: false,
        documents: [book],
      })
    })

    it('searches again and goes live once the listener connects', async () => {
      const listener = new Subject<{type: string}>()
      const {search, states$} = listBooks(() => listener, 'bookConnectsLate')
      const states = subscribeToStates(states$)

      listener.next({type: 'reconnect'})
      await vi.waitFor(() => expect(states).toHaveLength(1))
      listener.next({type: 'welcome'})
      await vi.waitFor(() => expect(states).toHaveLength(2))

      expect(search).toHaveBeenCalledTimes(2)
      expect(states.map(({connected}) => connected)).toEqual([false, true])
    })

    it('keeps the listed documents without searching again when a live listener goes down', async () => {
      const listener = new Subject<{type: string}>()
      const {search, states$} = listBooks(() => listener, 'bookGoesDown')
      const states = subscribeToStates(states$)

      listener.next({type: 'welcome'})
      await vi.waitFor(() => expect(states).toHaveLength(1))
      listener.next({type: 'reconnect'})
      await vi.waitFor(() => expect(states).toHaveLength(2))

      expect(search).toHaveBeenCalledTimes(1)
      expect(states).toEqual([
        {connected: true, fromCache: false, documents: [book]},
        {connected: false, fromCache: false, documents: [book]},
      ])
    })

    describe('when the listener fails', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })
      afterEach(() => {
        vi.useRealTimers()
      })

      // Searches and their results are delivered on the async scheduler, one tick each.
      const settle = () => vi.advanceTimersByTimeAsync(10)

      function createConnections() {
        const connections: Subject<{type: string}>[] = []
        const listen = () =>
          defer(() => {
            const connection = new Subject<{type: string}>()
            connections.push(connection)
            return connection
          })
        return {connections, listen, current: () => connections[connections.length - 1]}
      }

      it('lists the documents and reconnects after a channel error', async () => {
        const {connections, listen, current} = createConnections()
        const {search, states$} = listBooks(listen, 'bookChannelError')
        const states = subscribeToStates(states$)

        current().error(
          new ChannelError('Internal error', {error: {description: 'Internal error'}}),
        )
        await settle()
        expect(states).toEqual([{connected: false, fromCache: false, documents: [book]}])

        await vi.advanceTimersByTimeAsync(1_000)
        expect(connections).toHaveLength(2)
        current().next({type: 'welcome'})
        await settle()

        expect(search).toHaveBeenCalledTimes(2)
        expect(states.at(-1)).toEqual({connected: true, fromCache: false, documents: [book]})
      })

      it('lists the documents when the listener does not welcome in time', async () => {
        const {listen} = createConnections()
        const {states$} = listBooks(listen, 'bookNoWelcome')
        const states = subscribeToStates(states$)

        await vi.advanceTimersByTimeAsync(9_000)
        expect(states).toEqual([])
        await vi.advanceTimersByTimeAsync(1_000)
        await settle()
        expect(states).toEqual([{connected: false, fromCache: false, documents: [book]}])
      })

      it('still fails on an error in the query', async () => {
        const {listen, current} = createConnections()
        const {states$} = listBooks(listen, 'bookBadQuery')
        const errors: unknown[] = []
        const subscription = states$.subscribe({error: (error) => errors.push(error)})
        onTestFinished(() => subscription.unsubscribe())

        const error = new ChannelError('Bad query', {error: {type: 'queryParseError'}})
        current().error(error)
        await settle()

        expect(errors).toEqual([error])
      })
    })
  })
})
