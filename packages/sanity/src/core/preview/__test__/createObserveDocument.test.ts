import {
  createClient,
  type MutationEvent,
  type ReconnectEvent,
  type WelcomeEvent,
} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {filter, firstValueFrom, map, of, skip, Subject, throwError} from 'rxjs'
import {take} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, onTestFinished, vi} from 'vitest'

import {createGlobalListener} from '../createGlobalListener'
import {createObserveDocument, type ListenerMutationEventLike} from '../createObserveDocument'

/** How long the documents to fetch are collected before they are fetched in one query */
const FETCH_BATCH_MS = 100

function documentAt(revision: string, id = 'movie'): SanityDocument {
  return {
    _id: id,
    _type: 'movie',
    _rev: revision,
    _createdAt: '2024-08-27T09:01:42Z',
    _updatedAt: '2024-08-27T09:03:38Z',
    title: `${id} as of ${revision}`,
  }
}

function withoutRevision({_rev, ...document}: SanityDocument) {
  return document
}

/**
 * The event the listener reports for a transaction on a document. The transaction ID is the
 * revision it leaves the document at, and the effects replace the whole document.
 */
function mutationEvent({
  documentId,
  transactionId,
  previousRev,
  document,
  transition,
}: {
  documentId: string
  transactionId: string
  previousRev: string | undefined
  document: Omit<SanityDocument, '_rev'> | null
  transition: MutationEvent['transition']
}): MutationEvent {
  return {
    type: 'mutation',
    eventId: `${transactionId}#${documentId}`,
    documentId,
    transactionId,
    identity: 'p-editor',
    mutations: [],
    // the listener leaves it out for the transaction that creates the document
    ...(previousRev === undefined ? {} : {previousRev}),
    resultRev: transactionId,
    effects: {apply: [0, document], revert: []},
    transition,
    timestamp: '2024-08-27T09:03:38Z',
    visibility: 'query',
    transactionTotalEvents: 1,
    transactionCurrentEvent: 0,
  }
}

/** Lets the documents to fetch collect, then fetches them */
function fetchBatch() {
  return vi.advanceTimersByTimeAsync(FETCH_BATCH_MS)
}

/** The documents, leaving out each one emitted again at the revision emitted before it */
function withoutRepeats(documents: (SanityDocument | undefined)[]) {
  return documents.filter(
    (document, index) => index === 0 || document?._rev !== documents[index - 1]?._rev,
  )
}

/**
 * Observes documents the way the document preview store does: through the global listener, which
 * replays its latest welcome to each new subscriber. The test plays the dataset. It decides what
 * a fetch returns, and which of the events the listener reports it delivers, and when.
 */
function observeThroughGlobalListener() {
  const client = createClient({
    projectId: 'abc',
    dataset: 'production',
    apiVersion: '2024-08-27',
    useCdn: false,
  })
  vi.spyOn(client, 'withConfig').mockImplementation(() => client)

  const stored = new Map<string, SanityDocument>()
  const fetch = vi
    .spyOn(client.observable, 'fetch')
    // `fetch` is overloaded, and this implements the overload `createObserveDocument` calls
    .mockImplementation(() => of([...stored.values()]) as never)

  const listenerEvents = new Subject<WelcomeEvent | MutationEvent | ReconnectEvent>()
  vi.spyOn(client, 'listen').mockReturnValue(listenerEvents)
  const observeDocument = createObserveDocument({
    client,
    mutationChannel: createGlobalListener(client).pipe(
      filter(
        (event, index) =>
          event.type === 'mutation' ||
          event.type === 'welcome' ||
          (index === 0 && event.type === 'reconnect'),
      ),
      map((event) => (event.type === 'mutation' ? event : {type: 'connected' as const})),
    ),
  })

  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  onTestFinished(() => warn.mockRestore())

  const dataset = {
    /** Creates or updates the document, and returns the event the listener reports for it */
    save(id: string, revision: string) {
      const previous = stored.get(id)
      const next = documentAt(revision, id)
      stored.set(id, next)
      return mutationEvent({
        documentId: id,
        transactionId: revision,
        previousRev: previous?._rev,
        document: withoutRevision(next),
        transition: previous ? 'update' : 'appear',
      })
    },
    /** Deletes the document, and returns the event the listener reports for it */
    delete(id: string, transactionId: string) {
      const previous = stored.get(id)
      stored.delete(id)
      return mutationEvent({
        documentId: id,
        transactionId,
        previousRev: previous?._rev,
        document: null,
        transition: 'disappear',
      })
    },
  }

  const listener = {
    welcome: () => listenerEvents.next({type: 'welcome', listenerName: 'preview.global'}),
    reconnect: () => listenerEvents.next({type: 'reconnect'}),
    deliver: (...events: MutationEvent[]) => {
      for (const event of events) {
        listenerEvents.next(event)
      }
    },
  }

  function observe(id: string) {
    const emitted: (SanityDocument | undefined)[] = []
    const errors: unknown[] = []
    const subscription = observeDocument(id).subscribe({
      next: (document) => emitted.push(document),
      error: (error: unknown) => errors.push(error),
    })
    onTestFinished(() => subscription.unsubscribe())
    return {emitted, errors}
  }

  return {dataset, listener, fetch, warn, observe}
}

describe(createObserveDocument.name, () => {
  it('fetches the current version of the document when receiving a connected event', async () => {
    const mockedClient = createClient({
      projectId: 'abc',
      dataset: 'production',
      apiVersion: '2024-08-27',
      useCdn: false,
    })

    vi.spyOn(mockedClient.observable, 'fetch').mockImplementation(
      () => of([{_id: 'foo', fetched: true}]) as any,
    )
    vi.spyOn(mockedClient, 'withConfig').mockImplementation(() => mockedClient)

    const mutationChannel = new Subject<{type: 'connected'} | ListenerMutationEventLike>()

    const observeDocument = createObserveDocument({
      mutationChannel,
      client: mockedClient,
    })

    const initial = firstValueFrom(observeDocument('foo').pipe(take(1)))

    mutationChannel.next({type: 'connected'})

    expect(await initial).toEqual({_id: 'foo', fetched: true})
  })

  it('emits undefined if the document does not exist', async () => {
    const mockedClient = createClient({
      projectId: 'abc',
      dataset: 'production',
      apiVersion: '2024-08-27',
      useCdn: false,
    })

    vi.spyOn(mockedClient.observable, 'fetch').mockImplementation(() => of([]) as any)
    vi.spyOn(mockedClient, 'withConfig').mockImplementation(() => mockedClient)

    const mutationChannel = new Subject<{type: 'connected'} | ListenerMutationEventLike>()

    const observeDocument = createObserveDocument({
      mutationChannel,
      client: mockedClient,
    })

    const initial = firstValueFrom(observeDocument('foo').pipe(take(1)))

    mutationChannel.next({type: 'connected'})

    expect(await initial).toEqual(undefined)
  })

  it('applies a mendoza patch when received over the listener', async () => {
    const mockedClient = createClient({
      projectId: 'abc',
      dataset: 'production',
      apiVersion: '2024-08-27',
      useCdn: false,
    })

    vi.spyOn(mockedClient.observable, 'fetch').mockImplementation(
      () =>
        of([
          {
            _createdAt: '2024-08-27T09:01:42Z',
            _id: '1c32390c',
            _rev: 'a8403810-81f7-49e6-8860-e52cb9111431',
            _type: 'foo',
            _updatedAt: '2024-08-27T09:03:38Z',
            name: 'foo',
          },
        ]) as any,
    )
    vi.spyOn(mockedClient, 'withConfig').mockImplementation(() => mockedClient)

    const mutationChannel = new Subject<{type: 'connected'} | ListenerMutationEventLike>()

    const observeDocument = createObserveDocument({
      mutationChannel,
      client: mockedClient,
    })

    const final = firstValueFrom(observeDocument('1c32390c').pipe(skip(1), take(1)))

    mutationChannel.next({type: 'connected'})
    mutationChannel.next({
      type: 'mutation',
      documentId: '1c32390c',
      previousRev: 'a8403810-81f7-49e6-8860-e52cb9111431',
      resultRev: 'b3e7ebce-2bdd-4ab7-9056-b525773bd17a',
      transition: 'update',
      effects: {
        apply: [11, 3, 23, 0, 18, 22, '8', 23, 19, 20, 15, 17, 'foos', 'name'],
      },
    })

    expect(await final).toEqual({
      _createdAt: '2024-08-27T09:01:42Z',
      _id: '1c32390c',
      _rev: 'b3e7ebce-2bdd-4ab7-9056-b525773bd17a',
      _type: 'foo',
      _updatedAt: '2024-08-27T09:03:38Z',
      name: 'foos',
    })
  })

  describe('observing a document through the global listener', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('fetches the document when the listener welcomes it, then applies each mutation that continues from its revision', async () => {
      const {dataset, listener, fetch, warn, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')

      listener.welcome()
      expect(movie.emitted).toEqual([])
      await fetchBatch()
      expect(fetch).toHaveBeenCalledExactlyOnceWith(
        '*[_id in $ids]',
        {ids: ['movie']},
        {tag: 'preview.observe-document'},
      )
      expect(movie.emitted).toEqual([documentAt('r1')])

      listener.deliver(dataset.save('movie', 'r2'), dataset.save('movie', 'r3'))
      expect(movie.emitted).toEqual([documentAt('r1'), documentAt('r2'), documentAt('r3')])
      expect(warn).not.toHaveBeenCalled()
    })

    it('leaves out the mutations of other documents', async () => {
      const {dataset, listener, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      dataset.save('other', 'o1')
      const movie = observe('movie')
      listener.welcome()
      await fetchBatch()

      listener.deliver(
        dataset.save('other', 'o2'),
        dataset.save('movie', 'r2'),
        dataset.save('other', 'o3'),
      )
      expect(movie.emitted).toEqual([documentAt('r1'), documentAt('r2')])
    })

    it('emits undefined for a document that does not exist, then the document once it is created', async () => {
      const {dataset, listener, observe} = observeThroughGlobalListener()
      const movie = observe('movie')
      listener.welcome()
      await fetchBatch()
      expect(movie.emitted).toEqual([undefined])

      listener.deliver(dataset.save('movie', 'r1'), dataset.save('movie', 'r2'))
      expect(movie.emitted).toEqual([undefined, documentAt('r1'), documentAt('r2')])
    })

    it('emits undefined once the document is deleted, then the document once it is created again', async () => {
      const {dataset, listener, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')
      listener.welcome()
      await fetchBatch()

      listener.deliver(dataset.delete('movie', 'r2'))
      expect(movie.emitted).toEqual([documentAt('r1'), undefined])
      listener.deliver(dataset.save('movie', 'r3'), dataset.save('movie', 'r4'))
      expect(movie.emitted).toEqual([
        documentAt('r1'),
        undefined,
        documentAt('r3'),
        documentAt('r4'),
      ])
    })

    it('fetches the document again when the listener reconnects, and continues from the revision fetched', async () => {
      const {dataset, listener, fetch, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')
      listener.welcome()
      await fetchBatch()

      listener.reconnect()
      // committed while the listener is disconnected, so their events are never delivered
      dataset.save('movie', 'r2')
      dataset.save('movie', 'r3')
      listener.welcome()
      await fetchBatch()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(movie.emitted).toEqual([documentAt('r1'), documentAt('r3')])

      listener.deliver(dataset.save('movie', 'r4'))
      expect(movie.emitted).toEqual([documentAt('r1'), documentAt('r3'), documentAt('r4')])
    })

    it('skips a mutation that the fetched document already includes, and goes on from there without fetching again', async () => {
      const {dataset, listener, fetch, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')
      listener.welcome()
      // committed before the fetch runs, and delivered while the document is being fetched
      listener.deliver(dataset.save('movie', 'r2'))
      await fetchBatch()
      listener.deliver(dataset.save('movie', 'r3'), dataset.save('movie', 'r4'))

      expect(withoutRepeats(movie.emitted)).toEqual([
        documentAt('r2'),
        documentAt('r3'),
        documentAt('r4'),
      ])
      await vi.advanceTimersByTimeAsync(60_000)
      expect(fetch).toHaveBeenCalledOnce()
    })

    it('skips mutations that the fetched document already includes when they arrive after it, in any order', async () => {
      const {dataset, listener, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')
      listener.welcome()
      const toR2 = dataset.save('movie', 'r2')
      const toR3 = dataset.save('movie', 'r3')
      await fetchBatch()

      listener.deliver(toR3, toR2, dataset.save('movie', 'r4'))
      await vi.advanceTimersByTimeAsync(60_000)
      expect(withoutRepeats(movie.emitted)).toEqual([documentAt('r3'), documentAt('r4')])
    })

    it('shares the document between its observers, and fetches it once', async () => {
      const {dataset, listener, fetch, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const first = observe('movie')
      listener.welcome()
      await fetchBatch()

      const second = observe('movie')
      expect(second.emitted).toEqual([documentAt('r1')])
      listener.deliver(dataset.save('movie', 'r2'))
      expect(first.emitted).toEqual([documentAt('r1'), documentAt('r2')])
      expect(second.emitted).toEqual([documentAt('r1'), documentAt('r2')])
      expect(fetch).toHaveBeenCalledOnce()
    })

    it('fetches a document observed after the listener connected on the welcome the listener replays', async () => {
      const {dataset, listener, fetch, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      dataset.save('other', 'o1')
      observe('movie')
      listener.welcome()
      await fetchBatch()

      const other = observe('other')
      await fetchBatch()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenLastCalledWith(
        '*[_id in $ids]',
        {ids: ['other']},
        {tag: 'preview.observe-document'},
      )
      expect(other.emitted).toEqual([documentAt('o1', 'other')])

      listener.deliver(dataset.save('other', 'o2'))
      expect(other.emitted).toEqual([documentAt('o1', 'other'), documentAt('o2', 'other')])
    })

    it('fetches the documents observed at the same time in one query', async () => {
      const {dataset, listener, fetch, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      dataset.save('other', 'o1')
      const movie = observe('movie')
      const other = observe('other')
      listener.welcome()
      await fetchBatch()

      expect(fetch).toHaveBeenCalledExactlyOnceWith(
        '*[_id in $ids]',
        {ids: ['movie', 'other']},
        {tag: 'preview.observe-document'},
      )
      expect(movie.emitted).toEqual([documentAt('r1')])
      expect(other.emitted).toEqual([documentAt('o1', 'other')])
    })

    it('errors when the document cannot be fetched', async () => {
      const {listener, fetch, observe} = observeThroughGlobalListener()
      fetch.mockReturnValueOnce(throwError(() => new Error('Request failed')))
      const movie = observe('movie')
      listener.welcome()
      await fetchBatch()

      expect(movie.errors).toEqual([new Error('Request failed')])
    })

    it('errors when a mutation event comes without effects', async () => {
      const {dataset, listener, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')
      listener.welcome()
      await fetchBatch()

      const {effects: _effects, ...withoutEffects} = dataset.save('movie', 'r2')
      listener.deliver(withoutEffects)
      expect(movie.errors).toEqual([
        new Error(
          'Mutation event is missing effects. Is the listener set up with effectFormat=mendoza?',
        ),
      ])
    })
  })

  describe('mutations that do not continue from the revision of the document', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('fetches the document again when a mutation event goes missing, and applies later mutations to it', async () => {
      const {dataset, listener, fetch, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')
      listener.welcome()
      await fetchBatch()

      // its event is never delivered
      dataset.save('movie', 'r2')
      listener.deliver(dataset.save('movie', 'r3'))
      await vi.advanceTimersByTimeAsync(60_000)
      expect(fetch).toHaveBeenCalledTimes(2)

      listener.deliver(dataset.save('movie', 'r4'))
      expect(movie.emitted).toEqual([documentAt('r1'), documentAt('r3'), documentAt('r4')])
    })

    it('fetches the document again as soon as it holds back 20 mutation events, without waiting for the deadline', async () => {
      const {dataset, listener, fetch, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')
      listener.welcome()
      await fetchBatch()

      // its event is never delivered, so none of the 20 after it continue from the revision fetched
      dataset.save('movie', 'r2')
      listener.deliver(
        ...Array.from({length: 20}, (_, index) => dataset.save('movie', `r${index + 3}`)),
      )
      await fetchBatch()
      expect(fetch).toHaveBeenCalledTimes(2)

      listener.deliver(dataset.save('movie', 'r23'))
      expect(movie.emitted).toEqual([documentAt('r1'), documentAt('r22'), documentAt('r23')])
    })

    it('applies mutation events that arrive out of order in the order of their revisions', async () => {
      const {dataset, listener, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')
      listener.welcome()
      await fetchBatch()

      const toR2 = dataset.save('movie', 'r2')
      const toR3 = dataset.save('movie', 'r3')
      listener.deliver(toR3, toR2, dataset.save('movie', 'r4'))
      expect(movie.emitted).toEqual([
        documentAt('r1'),
        documentAt('r2'),
        documentAt('r3'),
        documentAt('r4'),
      ])
    })

    it('skips a mutation the fetch already includes without emitting the document again or warning', async () => {
      const {dataset, listener, warn, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')
      listener.welcome()
      listener.deliver(dataset.save('movie', 'r2'))
      await fetchBatch()

      listener.deliver(dataset.save('movie', 'r3'))
      expect(movie.emitted).toEqual([documentAt('r2'), documentAt('r3')])
      expect(warn).not.toHaveBeenCalled()
    })

    it('fetches the document again when it is created again before its deletion arrives', async () => {
      const {dataset, listener, fetch, observe} = observeThroughGlobalListener()
      dataset.save('movie', 'r1')
      const movie = observe('movie')
      listener.welcome()
      await fetchBatch()

      const deletion = dataset.delete('movie', 'r2')
      // the creation comes without a `previousRev`, so it can't be put in sequence after the deletion
      listener.deliver(dataset.save('movie', 'r3'), deletion)
      expect(movie.emitted).toEqual([documentAt('r1'), undefined])

      await vi.advanceTimersByTimeAsync(60_000)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(movie.emitted).toEqual([documentAt('r1'), undefined, documentAt('r3')])
    })
  })
})
