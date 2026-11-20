import {ChannelError, createClient, type ListenEvent, type MutationEvent} from '@sanity/client'
import {defer, NEVER, type Observable, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, onTestFinished, vi} from 'vitest'

import {createDocumentPreviewStore} from '../documentPreviewStore'
import {type InvalidationChannelEvent} from '../types'

function createSpiedClient() {
  const client = createClient({
    projectId: 'abc',
    dataset: 'production',
    apiVersion: '2024-08-27',
    useCdn: false,
  })
  vi.spyOn(client, 'withConfig').mockReturnValue(client)
  const fetch = vi.spyOn(client.observable, 'fetch').mockReturnValue(NEVER)
  const listen = vi.spyOn(client, 'listen').mockReturnValue(NEVER)
  return {client, fetch, listen}
}

describe('createDocumentPreviewStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('follows the global listener store it is given, without opening a listener', async () => {
    const {client, fetch, listen} = createSpiedClient()
    const globalListener = new Subject<{type: 'connected'} | MutationEvent>()
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const store = createDocumentPreviewStore({
      client,
      globalListenerStore: {globalListener, invalidationChannel},
    })

    const subscriptions = [
      store.unstable_observeDocument('article').subscribe(),
      store.observePaths({_type: 'reference', _ref: 'author'}, ['name']).subscribe(),
    ]
    await vi.advanceTimersByTimeAsync(1_000)
    expect(fetch).not.toHaveBeenCalled()

    globalListener.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(1_000)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenLastCalledWith(
      '*[_id in $ids]',
      {ids: ['article']},
      {tag: 'preview.observe-document'},
    )

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(1_000)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('"author"'),
      {},
      expect.objectContaining({tag: 'preview.document-paths'}),
    )

    expect(listen).not.toHaveBeenCalled()
    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })

  it('opens a listener of its own when it is not given a global listener store', () => {
    const {client, listen} = createSpiedClient()
    const store = createDocumentPreviewStore({client})

    const subscription = store.unstable_observeDocument('article').subscribe()

    expect(listen).toHaveBeenCalledTimes(1)
    expect(listen).toHaveBeenCalledWith('*', {}, expect.objectContaining({tag: 'preview.global'}))
    subscription.unsubscribe()
  })
})

// Batched fetches are collected for 100ms before they are sent.
const BATCH_DEBOUNCE_MS = 100

function setup() {
  const client = createClient({
    projectId: 'abc',
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

  it('loads documents, and loads them again once the listener connects', async () => {
    const {store, listener, fetchesTagged} = setup()
    const documents = collect(store.unstable_observeDocument('book'))

    listener.next(reconnect)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    expect(documents).toEqual([{_id: 'book', _type: 'book', _rev: 'rev'}])

    listener.next(welcome)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    expect(fetchesTagged('preview.observe-document')).toHaveLength(2)
  })

  it('loads version ids', async () => {
    const {store, listener} = setup()
    const versionIds = collect(store.unstable_observeVersionDocumentIds('book'))

    listener.next(reconnect)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    expect(versionIds).toEqual([['book', 'drafts.book']])
  })

  it('keeps what it loaded without loading again when a live listener goes down', async () => {
    const {store, listener, fetchesTagged} = setup()
    const documents = collect(store.unstable_observeDocument('book'))

    listener.next(welcome)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    listener.next(reconnect)
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)

    expect(fetchesTagged('preview.observe-document')).toHaveLength(1)
    expect(documents).toEqual([{_id: 'book', _type: 'book', _rev: 'rev'}])
  })

  it('loads documents for a subscriber that arrives during the outage', async () => {
    const {store, listener, fetchesTagged} = setup()
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

  it('loads documents and reconnects after a channel error', async () => {
    const {store, listener, connections, fetchesTagged} = setup()
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

  it('loads documents when the listener does not welcome in time', async () => {
    const {store} = setup()
    const documents = collect(store.unstable_observeDocument('book'))

    await vi.advanceTimersByTimeAsync(10_000 + BATCH_DEBOUNCE_MS)
    expect(documents).toEqual([{_id: 'book', _type: 'book', _rev: 'rev'}])
  })
})
