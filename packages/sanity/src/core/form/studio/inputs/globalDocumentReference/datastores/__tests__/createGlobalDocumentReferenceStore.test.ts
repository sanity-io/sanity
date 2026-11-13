import {
  createClient,
  type ListenEvent,
  type MutationEvent,
  type SanityClient,
  type SanityDocument,
} from '@sanity/client'
import {defineType, type GlobalDocumentReferenceSchemaType} from '@sanity/types'
import {Observable, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {LISTENER_RESET_DELAY} from '../../../../../../preview/constants'
import {createSchema} from '../../../../../../schema/createSchema'
import {isRecord} from '../../../../../../util/isRecord'
import {type GlobalDocumentReferenceInfo} from '../../../../../inputs/GlobalDocumentReferenceInput/types'
import {createGlobalDocumentReferenceStore} from '../createGlobalDocumentReferenceStore'

const BATCH_FETCH_WAIT = 10

const WELCOME: ListenEvent = {type: 'welcome', listenerName: 'gdr.preview'}

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'bookReference',
      type: 'globalDocumentReference',
      resourceType: 'dataset',
      resourceId: 'project.blog',
      to: [{type: 'book', title: 'Book', preview: {select: {title: 'title'}}}],
    }),
    defineType({
      name: 'bookWithAuthorReference',
      type: 'globalDocumentReference',
      resourceType: 'dataset',
      resourceId: 'project.blog',
      to: [
        {type: 'book', title: 'Book', preview: {select: {title: 'title', subtitle: 'author.name'}}},
      ],
    }),
    defineType({
      name: 'assetReference',
      type: 'globalDocumentReference',
      resourceType: 'media-library',
      resourceId: 'ml123',
      to: [{type: 'sanity.asset', title: 'Asset', preview: {select: {title: 'title'}}}],
    }),
  ],
})

function isGlobalDocumentReferenceSchemaType(
  type: unknown,
): type is GlobalDocumentReferenceSchemaType {
  return isRecord(type) && typeof type.resourceType === 'string' && Array.isArray(type.to)
}

function getReferenceType(name: string): GlobalDocumentReferenceSchemaType {
  const type = schema.get(name)
  if (!isGlobalDocumentReferenceSchemaType(type)) {
    throw new Error(`Expected "${name}" to compile to a global document reference type`)
  }
  return type
}

const bookReferenceType = getReferenceType('bookReference')
const bookWithAuthorReferenceType = getReferenceType('bookWithAuthorReference')
const assetReferenceType = getReferenceType('assetReference')

function createDocument(
  id: string,
  type: string,
  fields: Record<string, unknown> = {},
): SanityDocument {
  return {
    _id: id,
    _type: type,
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    ...fields,
  }
}

function createMutationEvent(documentId: string): MutationEvent {
  return {
    type: 'mutation',
    documentId,
    eventId: `${documentId}-event`,
    identity: 'user',
    mutations: [],
    timestamp: '2026-01-01T00:00:00Z',
    transactionId: `${documentId}-tx`,
    transition: 'update',
    visibility: 'query',
    transactionTotalEvents: 1,
    transactionCurrentEvent: 1,
  }
}

interface FakeResource {
  client: SanityClient
  documents: Record<string, SanityDocument>
  events: Subject<ListenEvent>
  connections: {opened: number; active: number}
  fetchedIds: string[][]
}

/**
 * A client for one referenced resource that counts the listener connections opened through it
 * and records every batch of document ids it fetches
 */
function createFakeResource(documents: Record<string, SanityDocument>): FakeResource {
  const client = createClient({
    projectId: 'project',
    dataset: 'blog',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  const events = new Subject<ListenEvent>()
  const connections = {opened: 0, active: 0}
  const fetchedIds: string[][] = []

  vi.spyOn(client.observable, 'listen').mockImplementation(
    () =>
      new Observable<ListenEvent>((subscriber) => {
        connections.opened++
        connections.active++
        const subscription = events.subscribe(subscriber)
        return () => {
          connections.active--
          subscription.unsubscribe()
        }
      }),
  )
  vi.spyOn(client.observable, 'getDocuments').mockImplementation((ids) => {
    fetchedIds.push(ids)
    return of(ids.map((id) => documents[id] ?? null))
  })

  return {client, documents, events, connections, fetchedIds}
}

function createStore(resourcesById: Record<string, FakeResource>) {
  const client = createClient({
    projectId: 'project',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  vi.spyOn(client, 'withConfig').mockImplementation((config) => {
    const resourceId = config?.resource?.id
    const resource = resourceId ? resourcesById[resourceId] : undefined
    if (!resource) {
      throw new Error(`Unexpected resource "${resourceId}"`)
    }
    return resource.client
  })
  return createGlobalDocumentReferenceStore({client})
}

function observe(observable: Observable<GlobalDocumentReferenceInfo>) {
  const values: GlobalDocumentReferenceInfo[] = []
  const subscription = observable.subscribe((value) => values.push(value))
  return {
    latest: () => values.at(-1),
    unsubscribe: () => subscription.unsubscribe(),
  }
}

function createBooks(count: number) {
  return Object.fromEntries(
    Array.from({length: count}, (_, index) => [
      `book-${index}`,
      createDocument(`book-${index}`, 'book', {title: `Book ${index}`}),
    ]),
  )
}

describe('createGlobalDocumentReferenceStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('previews of ten documents in one dataset share one listener and one fetch', async () => {
    const blog = createFakeResource(createBooks(10))
    const store = createStore({'project.blog': blog})

    const ids = Object.keys(blog.documents)
    const previews = ids.map((id) => observe(store.getReferenceInfo({_id: id}, bookReferenceType)))

    expect(blog.connections).toEqual({opened: 1, active: 1})

    blog.events.next(WELCOME)
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)

    expect(blog.fetchedIds).toEqual([ids])
    previews.forEach((preview, index) => {
      expect(preview.latest()).toMatchObject({
        id: `book-${index}`,
        type: 'book',
        availability: {available: true, reason: 'READABLE'},
        preview: {published: {title: `Book ${index}`}},
      })
    })
  })

  test('previews of the same document fetch it once', async () => {
    const blog = createFakeResource(createBooks(1))
    const store = createStore({'project.blog': blog})

    const previews = Array.from({length: 10}, () =>
      observe(store.getReferenceInfo({_id: 'book-0'}, bookReferenceType)),
    )

    blog.events.next(WELCOME)
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)

    expect(blog.connections.opened).toBe(1)
    expect(blog.fetchedIds).toEqual([['book-0']])
    previews.forEach((preview) => {
      expect(preview.latest()?.preview.published).toMatchObject({title: 'Book 0'})
    })
  })

  test('fields with different reference types share the listener of the dataset they point to', async () => {
    const blog = createFakeResource(createBooks(2))
    const store = createStore({'project.blog': blog})

    observe(store.getReferenceInfo({_id: 'book-0'}, bookReferenceType))
    observe(store.getReferenceInfo({_id: 'book-1'}, bookWithAuthorReferenceType))

    expect(blog.connections.opened).toBe(1)
    expect(store.getClient(bookReferenceType)).toBe(store.getClient(bookWithAuthorReferenceType))
  })

  test('each referenced resource gets its own listener', async () => {
    const blog = createFakeResource(createBooks(1))
    const library = createFakeResource({
      'asset-1': createDocument('asset-1', 'sanity.asset', {title: 'Asset 1'}),
    })
    const store = createStore({'project.blog': blog, 'ml123': library})

    const book = observe(store.getReferenceInfo({_id: 'book-0'}, bookReferenceType))
    const asset = observe(store.getReferenceInfo({_id: 'asset-1'}, assetReferenceType))

    expect(blog.connections).toEqual({opened: 1, active: 1})
    expect(library.connections).toEqual({opened: 1, active: 1})

    blog.events.next(WELCOME)
    library.events.next(WELCOME)
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)

    expect(blog.fetchedIds).toEqual([['book-0']])
    expect(library.fetchedIds).toEqual([['asset-1']])
    expect(book.latest()?.preview.published).toMatchObject({title: 'Book 0'})
    expect(asset.latest()?.preview.published).toMatchObject({title: 'Asset 1'})
  })

  test('a preview that subscribes after the listener connected still loads', async () => {
    const blog = createFakeResource(createBooks(2))
    const store = createStore({'project.blog': blog})

    observe(store.getReferenceInfo({_id: 'book-0'}, bookReferenceType))
    blog.events.next(WELCOME)
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)

    const late = observe(store.getReferenceInfo({_id: 'book-1'}, bookReferenceType))
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)

    expect(blog.connections.opened).toBe(1)
    expect(blog.fetchedIds).toEqual([['book-0'], ['book-1']])
    expect(late.latest()?.preview.published).toMatchObject({title: 'Book 1'})
  })

  test('search hits that already know their type skip the type lookup', async () => {
    const blog = createFakeResource(createBooks(1))
    const store = createStore({'project.blog': blog})

    const hit = observe(store.getReferenceInfo({_id: 'book-0', _type: 'book'}, bookReferenceType))
    blog.events.next(WELCOME)
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)

    expect(blog.fetchedIds).toEqual([['book-0']])
    expect(hit.latest()).toMatchObject({type: 'book', preview: {published: {title: 'Book 0'}}})
  })

  test('a mutation refetches only the document it touched', async () => {
    const blog = createFakeResource(createBooks(2))
    const store = createStore({'project.blog': blog})

    const first = observe(store.getReferenceInfo({_id: 'book-0'}, bookReferenceType))
    const second = observe(store.getReferenceInfo({_id: 'book-1'}, bookReferenceType))
    blog.events.next(WELCOME)
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)
    expect(blog.fetchedIds).toEqual([['book-0', 'book-1']])

    blog.documents['book-0'] = createDocument('book-0', 'book', {
      title: 'Book 0, second edition',
      _rev: 'book-0-rev-2',
    })
    blog.events.next(createMutationEvent('book-0'))
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)

    expect(blog.fetchedIds).toEqual([['book-0', 'book-1'], ['book-0']])
    expect(first.latest()?.preview.published).toMatchObject({title: 'Book 0, second edition'})
    expect(second.latest()?.preview.published).toMatchObject({title: 'Book 1'})

    blog.events.next(createMutationEvent('drafts.book-1'))
    blog.events.next(createMutationEvent('unrelated'))
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)

    expect(blog.fetchedIds).toHaveLength(2)
  })

  test('references followed by the preview selection use the same listener', async () => {
    const blog = createFakeResource({
      'book-0': createDocument('book-0', 'book', {
        title: 'The Dispossessed',
        author: {_type: 'reference', _ref: 'author-0'},
      }),
      'author-0': createDocument('author-0', 'author', {name: 'Ursula K. Le Guin'}),
    })
    const store = createStore({'project.blog': blog})

    const preview = observe(store.getReferenceInfo({_id: 'book-0'}, bookWithAuthorReferenceType))
    blog.events.next(WELCOME)
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)

    expect(blog.connections.opened).toBe(1)
    expect(blog.fetchedIds).toEqual([['book-0'], ['author-0']])
    expect(preview.latest()?.preview.published).toMatchObject({
      title: 'The Dispossessed',
      subtitle: 'Ursula K. Le Guin',
    })
  })

  test('keeps the listener open for a while after the last preview unsubscribes', async () => {
    const blog = createFakeResource(createBooks(2))
    const store = createStore({'project.blog': blog})

    const first = observe(store.getReferenceInfo({_id: 'book-0'}, bookReferenceType))
    blog.events.next(WELCOME)
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)
    first.unsubscribe()

    await vi.advanceTimersByTimeAsync(LISTENER_RESET_DELAY - 1)
    expect(blog.connections).toEqual({opened: 1, active: 1})

    const second = observe(store.getReferenceInfo({_id: 'book-1'}, bookReferenceType))
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)
    expect(blog.connections).toEqual({opened: 1, active: 1})
    expect(second.latest()?.preview.published).toMatchObject({title: 'Book 1'})

    second.unsubscribe()
    await vi.advanceTimersByTimeAsync(LISTENER_RESET_DELAY)
    expect(blog.connections).toEqual({opened: 1, active: 0})
  })

  test('reports why a document that cannot be fetched has no preview', async () => {
    const blog = createFakeResource({})
    vi.spyOn(blog.client.observable, 'request').mockImplementation(() =>
      of({omitted: [{id: 'book-404', reason: 'existence'}]}),
    )
    const store = createStore({'project.blog': blog})

    const preview = observe(store.getReferenceInfo({_id: 'book-404'}, bookReferenceType))
    blog.events.next(WELCOME)
    await vi.advanceTimersByTimeAsync(BATCH_FETCH_WAIT)

    expect(preview.latest()).toEqual({
      id: 'book-404',
      type: undefined,
      availability: {available: false, reason: 'NOT_FOUND'},
      preview: {published: undefined},
    })
  })
})
