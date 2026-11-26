import {
  ChannelError,
  ClientError,
  createClient,
  type ListenEvent,
  ServerError,
} from '@sanity/client'
import {defer, delay, Observable, of, Subject, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, onTestFinished, vi} from 'vitest'

import {stubDocumentVisibility} from '../../../../test/testUtils/documentVisibility'
import {it} from '../../../../test/testUtils/listenerErrorHandlerTest'
import {LISTENER_PAUSE_GRACE_PERIOD, listenerGate} from '../../store/listenerGate/listenerGate'
import {createDocumentIdSetObserver, type DocumentIdSetObserverState} from '../liveDocumentIdSet'

type Event = ListenEvent<Record<string, unknown>>

let releaseListenerGate: (() => void) | undefined

/**
 * A client whose listener connections can each be driven separately, and whose fetch answers with
 * the ids it is given, in order, one per fetch.
 */
function setup(fetchResults: (string[] | Observable<string[]>)[]) {
  const client = createClient({
    projectId: 'abc',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  vi.spyOn(client, 'withConfig').mockImplementation(() => client)

  const connections: Subject<Event>[] = []
  vi.spyOn(client.observable, 'listen').mockImplementation(
    () =>
      defer(() => {
        const connection = new Subject<Event>()
        connections.push(connection)
        return connection
      }) as never,
  )
  const fetch = vi.spyOn(client.observable, 'fetch').mockImplementation((() => {
    const next = fetchResults.shift() ?? []
    return Array.isArray(next) ? of(next) : next
  }) as never)

  const states: DocumentIdSetObserverState[] = []
  const errors: unknown[] = []
  const subscription = createDocumentIdSetObserver(client)('_type == "book"').subscribe({
    next: (state) => states.push(state),
    error: (error) => errors.push(error),
  })
  onTestFinished(() => subscription.unsubscribe())
  return {connections, current: () => connections[connections.length - 1], fetch, states, errors}
}

const welcome = {type: 'welcome', listenerName: 'test'} as Event
const reconnect = {type: 'reconnect'} as Event

function mutation(documentId: string, transition: 'appear' | 'disappear'): Event {
  return {type: 'mutation', documentId, transition} as Event
}

function responseError(statusCode: number) {
  const res = {
    statusCode,
    headers: {},
    body: {},
    url: 'https://example.api.sanity.io',
    method: 'GET',
  }
  return statusCode >= 500 ? new ServerError(res) : new ClientError(res)
}

// A fetch that fails with `error` the first time it is subscribed, and answers `ids` after that.
function failOnce(error: Error, ids: string[]): Observable<string[]> {
  let failed = false
  return defer(() => {
    if (failed) return of(ids)
    failed = true
    return throwError(() => error)
  })
}

describe('createDocumentIdSetObserver while its listener is down', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches the set, and fetches it again once the listener connects', () => {
    const {current, fetch, states} = setup([['book-1'], ['book-1', 'book-2']])

    current().next(reconnect)
    expect(states).toEqual([{status: 'reconnecting', documentIds: ['book-1']}])

    current().next(welcome)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(states.at(-1)).toEqual({status: 'connected', documentIds: ['book-1', 'book-2']})
  })

  it('keeps the set without fetching again when a live listener goes down', () => {
    const {current, fetch, states} = setup([['book-1']])

    current().next(welcome)
    current().next(reconnect)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(states).toEqual([
      {status: 'connected', documentIds: ['book-1']},
      {status: 'reconnecting', documentIds: ['book-1']},
    ])
  })

  it('never lets a slow fetch made while the listener was down replace a live one', async () => {
    const {current, states} = setup([of(['stale']).pipe(delay(100)), ['book-1']])

    current().next(reconnect)
    current().next(welcome)
    await vi.advanceTimersByTimeAsync(100)

    expect(states).toEqual([{status: 'connected', documentIds: ['book-1']}])
  })

  it('applies mutations once the listener connects', () => {
    const {current, states} = setup([['book-1'], ['book-1']])

    current().next(reconnect)
    current().next(welcome)
    current().next(mutation('book-2', 'appear'))
    current().next(mutation('book-1', 'disappear'))

    expect(states.at(-1)).toEqual({status: 'connected', documentIds: ['book-2']})
  })

  it('fetches the set and reconnects after a channel error', async () => {
    const {connections, current, states, errors} = setup([['book-1'], ['book-1', 'book-2']])

    current().error(new ChannelError('Internal error', {error: {description: 'Internal error'}}))
    await vi.advanceTimersByTimeAsync(0)
    expect(states).toEqual([{status: 'reconnecting', documentIds: ['book-1']}])

    await vi.advanceTimersByTimeAsync(1_000)
    expect(connections).toHaveLength(2)
    current().next(welcome)

    expect(errors).toEqual([])
    expect(states.at(-1)).toEqual({status: 'connected', documentIds: ['book-1', 'book-2']})
  })

  it('fetches the set when the listener does not welcome in time', async () => {
    const {states} = setup([['book-1']])

    await vi.advanceTimersByTimeAsync(10_000)
    expect(states).toEqual([{status: 'reconnecting', documentIds: ['book-1']}])
  })

  it('still fails on an error in the query', () => {
    const {current, errors} = setup([])
    const error = new ChannelError('Bad query', {error: {type: 'queryParseError'}})

    current().error(error)

    expect(errors).toEqual([error])
  })

  it('keeps the set when the registered error handler takes over a listener that fails irrecoverably', async ({
    listenerErrorHandler,
  }) => {
    const {connections, current, states, errors} = setup([['book-1']])
    current().next(welcome)

    const error = new ChannelError('Denied', {error: {type: 'permissionDeniedError'}})
    current().error(error)
    await vi.advanceTimersByTimeAsync(60_000)

    expect(listenerErrorHandler.handle).toHaveBeenCalledWith(error)
    expect(errors).toEqual([])
    expect(states.at(-1)).toEqual({status: 'reconnecting', documentIds: ['book-1']})
    expect(connections).toHaveLength(1)
  })
})

describe('createDocumentIdSetObserver when a fetch fails', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries a fetch that fails transiently, and keeps the listener', async () => {
    const {connections, current, states, errors} = setup([failOnce(responseError(503), ['book-1'])])

    current().next(welcome)
    expect(states).toEqual([])

    // The longest first retry delay (`reconnectDelay(0)`).
    await vi.advanceTimersByTimeAsync(1_000)
    expect(states).toEqual([{status: 'connected', documentIds: ['book-1']}])

    current().next(mutation('book-2', 'appear'))
    expect(states.at(-1)).toEqual({status: 'connected', documentIds: ['book-1', 'book-2']})
    expect(connections).toHaveLength(1)
    expect(errors).toEqual([])
  })

  it('retries a fetch made while the listener is down', async () => {
    const {current, states, errors} = setup([
      failOnce(new TypeError('Failed to fetch'), ['book-1']),
    ])

    current().next(reconnect)
    await vi.advanceTimersByTimeAsync(1_000)

    expect(states).toEqual([{status: 'reconnecting', documentIds: ['book-1']}])
    expect(errors).toEqual([])
  })

  it('fails without retrying on a fetch error that is not transient', async () => {
    const error = responseError(403)
    const {current, fetch, errors} = setup([throwError(() => error)])

    current().next(welcome)
    await vi.advanceTimersByTimeAsync(1_000)

    expect(errors).toEqual([error])
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('createDocumentIdSetObserver on a hidden page', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    releaseListenerGate = listenerGate.enable()
  })
  afterEach(() => {
    releaseListenerGate?.()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('reports reconnecting while paused on a hidden page, and refetches the set when shown', () => {
    const documentVisibility = stubDocumentVisibility()
    const client = createClient({
      projectId: 'abc',
      dataset: 'production',
      apiVersion: '2025-02-19',
      useCdn: false,
    })
    const connections = {opened: 0, open: 0}
    vi.spyOn(client.observable, 'listen').mockImplementation(
      () =>
        new Observable((subscriber) => {
          connections.opened++
          connections.open++
          subscriber.next({type: 'welcome', listenerName: 'id-set'})
          return () => {
            connections.open--
          }
        }) as never,
    )
    const fetch = vi
      .spyOn(client.observable, 'fetch')
      .mockImplementationOnce(() => of(['a']) as never)
      .mockImplementationOnce(() => of(['a', 'b']) as never)

    const states: DocumentIdSetObserverState[] = []
    const subscription = createDocumentIdSetObserver(client)('_type == "article"').subscribe(
      (state) => states.push(state),
    )

    documentVisibility.set('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    expect(connections.open).toBe(0)

    documentVisibility.set('visible')
    expect(connections).toEqual({opened: 2, open: 1})
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(states).toEqual([
      {status: 'connected', documentIds: ['a']},
      {status: 'reconnecting', documentIds: ['a']},
      {status: 'connected', documentIds: ['a', 'b']},
    ])
    subscription.unsubscribe()
  })
})
