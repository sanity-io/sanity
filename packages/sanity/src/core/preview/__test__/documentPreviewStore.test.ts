import {ChannelError, createClient, type ListenEvent} from '@sanity/client'
import {defer, type Observable, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, onTestFinished, vi} from 'vitest'

import {it} from '../../../../test/testUtils/listenerOutagesTest'
import {createDocumentPreviewStore} from '../documentPreviewStore'

// Batched fetches are collected for 100ms before they are sent.
const BATCH_DEBOUNCE_MS = 100

function setup(projectId: string) {
  const client = createClient({
    projectId,
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  vi.spyOn(client, 'withConfig').mockImplementation(() => client)

  // Every subscription opens a new connection, as `client.listen()` does.
  const connections: Subject<ListenEvent<Record<string, unknown>>>[] = []
  vi.spyOn(client, 'listen').mockImplementation(
    () =>
      defer(() => {
        const connection = new Subject<ListenEvent<Record<string, unknown>>>()
        connections.push(connection)
        return connection
      }) as never,
  )
  const listener = {
    next: (event: ListenEvent<Record<string, unknown>>) => connections.at(-1)?.next(event),
    error: (error: unknown) => connections.at(-1)?.error(error),
  }

  const fetch = vi.spyOn(client.observable, 'fetch').mockImplementation(((
    query: string,
    params: {ids?: string[]},
    options: {tag?: string},
  ) => {
    if (options.tag === 'preview.observe-document') {
      return of((params.ids ?? []).map((id) => ({_id: id, _type: 'book', _rev: 'rev'})))
    }
    if (options.tag === 'preview.observe-version-ids') {
      return of([['drafts.book', 'book']])
    }
    throw new Error(`Unexpected fetch: ${query}`)
  }) as never)

  const store = createDocumentPreviewStore({client})
  const fetchesTagged = (tag: string) =>
    fetch.mock.calls.filter(([, , options]) => (options as {tag?: string})?.tag === tag)
  return {store, listener, connections, fetchesTagged}
}

function collect<T>(observable: Observable<T>) {
  const values: T[] = []
  const subscription = observable.subscribe((value) => values.push(value))
  onTestFinished(() => subscription.unsubscribe())
  return values
}

const welcome = {type: 'welcome', listenerName: 'preview.global'} as const
const reconnect = {type: 'reconnect'} as const

describe('createDocumentPreviewStore while the global listener is down', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads documents, and loads them again once the listener connects', async ({projectId}) => {
    const {store, listener, fetchesTagged} = setup(projectId)
    const documents = collect(store.unstable_observeDocument('book'))

    listener.next(reconnect)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    expect(documents).toEqual([{_id: 'book', _type: 'book', _rev: 'rev'}])

    listener.next(welcome)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    expect(fetchesTagged('preview.observe-document')).toHaveLength(2)
  })

  it('loads version ids', async ({projectId}) => {
    const {store, listener} = setup(projectId)
    const versionIds = collect(store.unstable_observeVersionDocumentIds('book'))

    listener.next(reconnect)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    expect(versionIds).toEqual([['book', 'drafts.book']])
  })

  it('keeps what it loaded without loading again when a live listener goes down', async ({
    projectId,
  }) => {
    const {store, listener, fetchesTagged} = setup(projectId)
    const documents = collect(store.unstable_observeDocument('book'))

    listener.next(welcome)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    listener.next(reconnect)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)

    expect(fetchesTagged('preview.observe-document')).toHaveLength(1)
    expect(documents).toEqual([{_id: 'book', _type: 'book', _rev: 'rev'}])
  })

  it('loads documents for a subscriber that arrives during the outage', async ({projectId}) => {
    const {store, listener, fetchesTagged} = setup(projectId)
    collect(store.unstable_observeDocument('book'))
    listener.next(welcome)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    listener.next(reconnect)

    // The listener replays its latest `reconnect` to the new subscriber.
    const documents = collect(store.unstable_observeDocument('author'))
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)

    expect(fetchesTagged('preview.observe-document')).toHaveLength(2)
    expect(documents).toEqual([{_id: 'author', _type: 'book', _rev: 'rev'}])
  })

  it('loads documents and reconnects after a channel error', async ({projectId}) => {
    const {store, listener, connections, fetchesTagged} = setup(projectId)
    const documents = collect(store.unstable_observeDocument('book'))

    listener.error(new ChannelError('Internal error', {error: {description: 'Internal error'}}))
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    expect(documents).toEqual([{_id: 'book', _type: 'book', _rev: 'rev'}])

    await vi.advanceTimersByTimeAsync(1_000)
    expect(connections).toHaveLength(2)
    listener.next(welcome)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    expect(fetchesTagged('preview.observe-document')).toHaveLength(2)
  })

  it('loads documents when the listener does not welcome in time', async ({projectId}) => {
    const {store} = setup(projectId)
    const documents = collect(store.unstable_observeDocument('book'))

    await vi.advanceTimersByTimeAsync(10_000 + BATCH_DEBOUNCE_MS)
    expect(documents).toEqual([{_id: 'book', _type: 'book', _rev: 'rev'}])
  })

  it('keeps what it loaded when the error handler of its project takes over a listener that fails for good', async ({
    projectId,
    listenerErrorHandler,
  }) => {
    const {store, listener, connections, fetchesTagged} = setup(projectId)
    const documents = collect(store.unstable_observeDocument('book'))
    listener.next(welcome)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)

    const error = new ChannelError('Denied', {error: {type: 'permissionDeniedError'}})
    listener.error(error)
    await vi.advanceTimersByTimeAsync(60_000)

    expect(listenerErrorHandler.handle).toHaveBeenCalledWith(error)
    expect(documents).toEqual([{_id: 'book', _type: 'book', _rev: 'rev'}])
    expect(fetchesTagged('preview.observe-document')).toHaveLength(1)
    expect(connections).toHaveLength(1)
  })
})
