import {
  ChannelError,
  ClientError,
  createClient,
  type SanityClient,
  ServerError,
} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {concat, defer, firstValueFrom, NEVER, Observable, of, Subject, throwError} from 'rxjs'
import {createSearch, LISTENER_PAUSE_GRACE_PERIOD, listenerGate, type SearchSort} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, onTestFinished, vi} from 'vitest'

import {stubDocumentVisibility} from '../../../../../test/testUtils/documentVisibility'
import {listenSearchQuery, resolveSearchOrdering, type SearchQueryState} from '../listenSearchQuery'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  compileFieldPath: vi.fn(),
  createSearch: vi.fn(() => vi.fn(() => of({hits: []}))),
  getSearchableTypes: vi.fn(() => [{name: 'author'}]),
}))

const mockCreateSearch = vi.mocked(createSearch)

// `LISTENER_PAUSE_GRACE_PERIOD_STORAGE_KEY`, which `sanity` does not export
const GRACE_PERIOD_STORAGE_KEY = '_sanity_listenerPauseGracePeriod'

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

function createGatedClient() {
  const connections = {opened: 0, open: 0, current: null as Subject<unknown> | null}
  const client = createClient({
    projectId: 'abc',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  vi.spyOn(client, 'listen').mockImplementation(
    () =>
      new Observable((subscriber) => {
        const connection = new Subject<unknown>()
        connections.opened++
        connections.open++
        connections.current = connection
        const subscription = connection.subscribe(subscriber)
        return () => {
          connections.open--
          subscription.unsubscribe()
        }
      }) as never,
  )
  return {client, connections}
}

function subscribeToList(client: SanityClient, searchQuery: string) {
  const states: Array<Pick<SearchQueryState, 'connected' | 'documents'>> = []
  const errors: unknown[] = []
  const subscription = listenSearchQuery({
    client,
    filter: '_type == "author"',
    limit: 25,
    params: {},
    schema: {} as Schema,
    searchQuery,
    sort: {by: [{field: '_updatedAt', direction: 'desc'}]},
    staticTypeNames: ['author'],
  }).subscribe({
    next: ({connected, documents}) => states.push({connected, documents}),
    error: (error) => errors.push(error),
  })
  return {states, errors, subscription}
}

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

  describe('when a fetch fails', () => {
    const book = {_id: 'book-1', _type: 'book'}

    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    // Searches and their results are delivered on the async scheduler, one tick each.
    const settle = () => vi.advanceTimersByTimeAsync(10)
    // The longest first retry delay (`reconnectDelay(0)`).
    const FIRST_RETRY_MS = 1_000

    function responseError(statusCode: number) {
      const res = {
        statusCode,
        headers: {},
        body: {},
        url: 'https://abc.api.sanity.io',
        method: 'GET',
      }
      return statusCode >= 500 ? new ServerError(res) : new ClientError(res)
    }

    // A request that fails with `error` the first time it is sent, and answers `value` after that.
    function failOnce<T>(error: Error, value: T) {
      let requests = 0
      const request$ = defer(() => {
        requests += 1
        return requests === 1 ? throwError(() => error) : of(value)
      })
      return {request$, requests: () => requests}
    }

    // Each test lists its own type: the list caches its last result per query across calls.
    function listBooks(
      typeName: string,
      {search$, typeNames$}: {search$?: Observable<unknown>; typeNames$?: Observable<unknown>},
    ) {
      const listener = new Subject<{type: string}>()
      const search = vi.fn(() => search$ ?? of({hits: [{hit: book}]}))
      mockCreateSearch.mockReturnValue(search as never)
      const client = {
        listen: vi.fn(() => listener),
        observable: {fetch: vi.fn(() => typeNames$ ?? of([typeName]))},
      } as unknown as SanityClient
      const states: SearchQueryState[] = []
      const errors: unknown[] = []
      const subscription = listenSearchQuery({
        client,
        filter: `_type == "${typeName}"`,
        limit: 25,
        params: {},
        schema: {} as Schema,
        searchQuery: '',
        sort: {by: [{field: '_updatedAt', direction: 'desc'}]},
        // Without static type names, the list fetches the types it holds first.
        staticTypeNames: typeNames$ ? undefined : [typeName],
      }).subscribe({next: (state) => states.push(state), error: (error) => errors.push(error)})
      onTestFinished(() => subscription.unsubscribe())
      return {client, listener, search, states, errors}
    }

    it('searches again when the search fails transiently, and keeps the listener', async () => {
      const searchRequest = failOnce(responseError(503), {hits: [{hit: book}]})
      const {client, listener, states, errors} = listBooks('bookSearch503', {
        search$: searchRequest.request$,
      })

      listener.next({type: 'welcome'})
      await settle()
      expect(states).toEqual([])

      await vi.advanceTimersByTimeAsync(FIRST_RETRY_MS)
      expect(searchRequest.requests()).toBe(2)
      expect(states).toEqual([{connected: true, fromCache: false, documents: [book]}])
      expect(errors).toEqual([])
      // The list kept its listener rather than opening a new one.
      expect(client.listen).toHaveBeenCalledTimes(1)
    })

    it('fetches the type names again when they fail transiently', async () => {
      const typeNamesRequest = failOnce(new TypeError('Failed to fetch'), ['bookTypes'])
      const {listener, states, errors} = listBooks('bookTypes', {
        typeNames$: typeNamesRequest.request$,
      })

      listener.next({type: 'welcome'})
      await settle()
      await vi.advanceTimersByTimeAsync(FIRST_RETRY_MS)
      await settle()

      expect(typeNamesRequest.requests()).toBe(2)
      expect(states).toEqual([{connected: true, fromCache: false, documents: [book]}])
      expect(errors).toEqual([])
    })

    it('fails without searching again when the search is denied', async () => {
      const denied = responseError(403)
      const searchRequest = failOnce(denied, {hits: []})
      const {listener, errors} = listBooks('bookSearch403', {search$: searchRequest.request$})

      listener.next({type: 'welcome'})
      await settle()
      await vi.advanceTimersByTimeAsync(FIRST_RETRY_MS)

      expect(errors).toEqual([denied])
      expect(searchRequest.requests()).toBe(1)
    })
  })

  describe('on a hidden page', () => {
    afterEach(() => {
      localStorage.removeItem(GRACE_PERIOD_STORAGE_KEY)
      listenerGate.setEnabled(false)
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('shows the list as reconnecting while paused, and searches again when shown', async () => {
      vi.useFakeTimers()
      listenerGate.setEnabled(true)
      const documentVisibility = stubDocumentVisibility()
      const connections = {opened: 0, open: 0}
      const client = createClient({
        projectId: 'abc',
        dataset: 'production',
        apiVersion: '2025-02-19',
        useCdn: false,
      })
      vi.spyOn(client, 'listen').mockImplementation(
        () =>
          new Observable((subscriber) => {
            connections.opened++
            connections.open++
            subscriber.next({type: 'welcome'})
            return () => {
              connections.open--
            }
          }) as never,
      )
      const search = vi
        .fn()
        .mockReturnValueOnce(of({hits: [{hit: {_id: 'a', _type: 'author'}}]}))
        .mockReturnValueOnce(
          of({hits: [{hit: {_id: 'a', _type: 'author'}}, {hit: {_id: 'b', _type: 'author'}}]}),
        )
      mockCreateSearch.mockReturnValue(search as never)

      const states: Array<Pick<SearchQueryState, 'connected' | 'documents'>> = []
      const subscription = listenSearchQuery({
        client,
        filter: '_type == "author"',
        limit: 25,
        params: {},
        schema: {} as Schema,
        searchQuery: 'hidden-page',
        sort: {by: [{field: '_updatedAt', direction: 'desc'}]},
        staticTypeNames: ['author'],
      }).subscribe(({connected, documents}) => states.push({connected, documents}))
      await vi.advanceTimersByTimeAsync(0)

      documentVisibility.set('hidden')
      await vi.advanceTimersByTimeAsync(LISTENER_PAUSE_GRACE_PERIOD)
      expect(connections.open).toBe(0)

      documentVisibility.set('visible')
      await vi.advanceTimersByTimeAsync(1_000)
      expect(connections).toEqual({opened: 2, open: 1})
      expect(states).toEqual([
        {connected: true, documents: [{_id: 'a', _type: 'author'}]},
        {connected: false, documents: [{_id: 'a', _type: 'author'}]},
        {
          connected: true,
          documents: [
            {_id: 'a', _type: 'author'},
            {_id: 'b', _type: 'author'},
          ],
        },
      ])
      subscription.unsubscribe()
    })

    it('shows the list as connected when the page is shown right after a mutation and a pause', async () => {
      vi.useFakeTimers()
      listenerGate.setEnabled(true)
      const documentVisibility = stubDocumentVisibility()
      const {client, connections} = createGatedClient()
      mockCreateSearch.mockReturnValue(
        vi.fn(() => of({hits: [{hit: {_id: 'a', _type: 'author'}}]})) as never,
      )

      const {states, errors, subscription} = subscribeToList(client, 'pause-after-mutation')
      connections.current!.next({type: 'welcome'})
      await vi.advanceTimersByTimeAsync(0)

      documentVisibility.set('hidden')
      await vi.advanceTimersByTimeAsync(LISTENER_PAUSE_GRACE_PERIOD - 500)
      // A mutation in the last second before the pause opens a throttle window
      connections.current!.next({type: 'mutation', visibility: 'query'})
      await vi.advanceTimersByTimeAsync(500)
      expect(connections.open).toBe(0)

      documentVisibility.set('visible')
      connections.current!.next({type: 'welcome'})
      await vi.advanceTimersByTimeAsync(5_000)

      expect(errors).toEqual([])
      expect(connections).toMatchObject({opened: 2, open: 1})
      expect(states.at(-1)).toEqual({connected: true, documents: [{_id: 'a', _type: 'author'}]})
      subscription.unsubscribe()
    })

    it('does not time out while a page opened in the background has not been shown', async () => {
      vi.useFakeTimers()
      listenerGate.setEnabled(true)
      const documentVisibility = stubDocumentVisibility('hidden')
      const {client, connections} = createGatedClient()
      mockCreateSearch.mockReturnValue(
        vi.fn(() => of({hits: [{hit: {_id: 'a', _type: 'author'}}]})) as never,
      )

      const {states, errors, subscription} = subscribeToList(client, 'opened-in-background')
      await vi.advanceTimersByTimeAsync(5 * 60_000)
      expect(errors).toEqual([])
      expect(connections.opened).toBe(0)

      documentVisibility.set('visible')
      connections.current!.next({type: 'welcome'})
      await vi.advanceTimersByTimeAsync(1)

      expect(errors).toEqual([])
      expect(states).toEqual([{connected: true, documents: [{_id: 'a', _type: 'author'}]}])
      subscription.unsubscribe()
    })

    it('does not time out while paused before the first welcome, and times out each connection on its own', async () => {
      vi.useFakeTimers()
      // A grace period shorter than the welcome timeout pauses the listener before it can time out
      localStorage.setItem(GRACE_PERIOD_STORAGE_KEY, '1000')
      listenerGate.setEnabled(true)
      const documentVisibility = stubDocumentVisibility()
      const {client, connections} = createGatedClient()
      mockCreateSearch.mockReturnValue(
        vi.fn(() => of({hits: [{hit: {_id: 'a', _type: 'author'}}]})) as never,
      )

      const {states, errors, subscription} = subscribeToList(client, 'paused-before-welcome')
      await vi.advanceTimersByTimeAsync(5_000)
      documentVisibility.set('hidden')
      await vi.advanceTimersByTimeAsync(60_000)
      expect(connections.open).toBe(0)
      expect(errors).toEqual([])
      expect(states).toEqual([])

      documentVisibility.set('visible')
      // The new connection gets the full welcome timeout, after which the list is fetched without it
      await vi.advanceTimersByTimeAsync(9_999)
      expect(states).toEqual([])
      await vi.advanceTimersByTimeAsync(1 + 10)
      expect(errors).toEqual([])
      expect(states).toEqual([{connected: false, documents: [{_id: 'a', _type: 'author'}]}])
      subscription.unsubscribe()
    })
  })
})
