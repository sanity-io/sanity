import {type SanityClient} from '@sanity/client'
import {
  concat,
  type ConnectableObservable,
  EMPTY,
  firstValueFrom,
  lastValueFrom,
  type Observable,
  of,
  Subject,
  timer,
} from 'rxjs'
import {buffer, publish, takeWhile} from 'rxjs/operators'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {getFallbackLocaleSource} from '../../../../i18n/fallback'
import {type DocumentAvailability, type DraftsModelDocumentAvailability} from '../../../../preview'
import {createSchema} from '../../../../schema'
import {editState, type EditStateFor} from './editState'
import {validation} from './validation'

// Mock `./editState`
const mockEditState = editState as Mock<typeof editState>
vi.mock('./editState', () => ({editState: vi.fn()}))

const schema = createSchema({
  name: 'default',
  types: [
    {
      name: 'movie',
      title: 'Movie',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'exampleRef', type: 'reference', to: [{type: 'movie'}]},
        {name: 'exampleRefTwo', type: 'reference', to: [{type: 'movie'}]},
      ],
    },
  ],
})

const AVAILABLE: DocumentAvailability = {available: true, reason: 'READABLE'}
const NOT_FOUND: DocumentAvailability = {available: false, reason: 'NOT_FOUND'}

// A fixture used to set up a validation stream/subscription and wait
// for certain events (e.g. when validation is finished running)
function createSubscription(
  client: SanityClient,
  observeDocumentPairAvailability: (id: string) => Observable<DraftsModelDocumentAvailability>,
) {
  const getClient = () => client

  const stream = validation(
    {
      client,
      getClient,
      schema,
      observeDocumentPairAvailability,
      i18n: getFallbackLocaleSource(),
      serverActionsEnabled: false,
    },
    {publishedId: 'example-id', draftId: 'drafts.example-id'},
    'movie',
  ).pipe(publish())

  // Publish and connect this for the tests
  ;(stream as ConnectableObservable<unknown>).connect()

  // Create a subject we can use to notify via `done.next()`
  const done = new Subject<void>()

  // Create a subscription that collects all emissions until `done.next()`
  const subscription = firstValueFrom(stream.pipe(buffer(done)))

  return {
    subscription,
    closeSubscription: () => done.next(),
    doneValidating: () => {
      return lastValueFrom(stream.pipe(takeWhile((e) => e.isValidating, true)))
    },
  }
}
// @todo: fix mock sanity client is not compatible with SanityClient
function getMockClient() {
  return createMockSanityClient() as any as SanityClient
}

/**
 * READ THIS: Each tests passes when being run individually, but not when run as part of the whole suite.
 * It's probably a symptom of something wrong with the caching and should be investigated.
 */
describe('validation', () => {
  beforeEach(() => {
    mockEditState.mockReset()
  })

  it('runs `editState` through `validateDocument` to create a stream of validation statuses', async () => {
    const client = getMockClient()
    const mockEditStateSubject = new Subject<EditStateFor>()

    mockEditState.mockImplementation(() => mockEditStateSubject.asObservable())

    const {subscription, closeSubscription, doneValidating} = createSubscription(
      client,
      () => EMPTY,
    )

    // simulate first emission from validation listener
    mockEditStateSubject.next({
      id: 'example-id',
      draft: {
        _id: 'example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'exampleRev1',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 5,
      },
      transactionSyncLock: null,
      liveEdit: false,
      published: null,
      type: 'movie',
      ready: true,
    })

    await doneValidating()
    closeSubscription()

    await expect(subscription).resolves.toMatchObject([
      {
        isValidating: true,
        validation: [],
      },
      {
        isValidating: false,
        validation: [
          {
            item: {message: 'Expected type "String", got "Number"'},
            level: 'error',
            path: ['title'],
          },
        ],
      },
    ])
    mockEditStateSubject.complete()
  })

  it.skip('re-runs validation when the edit state changes', async () => {
    const client = getMockClient()
    const mockEditStateSubject = new Subject<EditStateFor>()

    mockEditState.mockImplementation(() => mockEditStateSubject.asObservable())

    const {subscription, closeSubscription, doneValidating} = createSubscription(
      client,
      () => EMPTY,
    )

    // simulate first emission from validation listener
    mockEditStateSubject.next({
      id: 'example-id',
      draft: {
        _id: 'example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'exampleRev2',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 5,
      },
      transactionSyncLock: null,
      liveEdit: false,
      published: null,
      type: 'movie',
      ready: true,
    })

    // wait till validation is done before pushing a valid value
    await doneValidating()

    // push a valid value
    mockEditStateSubject.next({
      id: 'example-id',
      draft: {
        _id: 'example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'exampleRev3',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 'valid title',
      },
      transactionSyncLock: null,
      liveEdit: false,
      published: null,
      type: 'movie',
      ready: true,
    })

    await doneValidating()

    closeSubscription()

    await expect(subscription).resolves.toMatchObject([
      {isValidating: true, validation: []},
      {
        isValidating: false,
        validation: [{item: {message: 'Expected type "String", got "Number"'}}],
      },
      {isValidating: true, validation: [{item: {message: 'Expected type "String", got "Number"'}}]},
      {isValidating: false, validation: []},
    ])
    mockEditStateSubject.complete()
  })

  it.skip('re-runs validation when dependency events change', async () => {
    const client = getMockClient()
    const subject = new Subject<DraftsModelDocumentAvailability>()

    // Mock `editState`
    const mockEditStateSubject = new Subject<EditStateFor>()
    mockEditState.mockImplementation(() => mockEditStateSubject.asObservable())

    const observeDocumentPairAvailability = (
      id: string,
    ): Observable<DraftsModelDocumentAvailability> =>
      id === 'example-ref-id'
        ? concat(of({published: AVAILABLE, draft: AVAILABLE}), subject)
        : concat(
            of({published: AVAILABLE, draft: AVAILABLE}),
            of({published: AVAILABLE, draft: AVAILABLE}),
          )

    const {subscription, closeSubscription, doneValidating} = createSubscription(
      client,
      observeDocumentPairAvailability,
    )

    // simulate first emission from validation listener
    mockEditStateSubject.next({
      id: 'example-id',
      draft: {
        _id: 'example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'exampleRev4',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 'testing',
        exampleRef: {_ref: 'example-ref-id'},
        exampleRefTwo: {_ref: 'example-ref-other'},
      },
      transactionSyncLock: null,
      liveEdit: false,
      published: null,
      type: 'movie',
      ready: true,
    })
    await doneValidating()

    subject.next({published: NOT_FOUND, draft: AVAILABLE})

    await doneValidating()

    // close the buffer
    closeSubscription()

    expect(await subscription).toMatchObject([
      {isValidating: true, validation: [], revision: 'exampleRev4'},
      {isValidating: false, validation: [], revision: 'exampleRev4'},
      {isValidating: true, validation: [], revision: 'exampleRev4'},
      {
        isValidating: false,
        validation: [
          {
            item: {message: /.+/},
            level: 'error',
            path: ['exampleRef'],
          },
        ],
      },
    ])
    mockEditStateSubject.complete()
  })

  // this means that when you subscribe to the same document, you'll
  // immediately get the previous value emitted to you
  // @todo: investigate why this fails
  it.skip('replays the last known version via `memoize` and `publishReplay`', async () => {
    const client = getMockClient()

    // Mock `editState`
    const mockEditStateSubject = new Subject<EditStateFor>()
    mockEditState.mockImplementation(() => mockEditStateSubject.asObservable())

    const subscription = lastValueFrom(
      validation(
        {
          client,
          schema,
          getClient: () => client,
          observeDocumentPairAvailability: vi.fn(() => EMPTY),
          i18n: getFallbackLocaleSource(),
          serverActionsEnabled: false,
        },
        {publishedId: 'example-id', draftId: 'drafts.example-id'},
        'movie',
      ).pipe(buffer(timer(500))),
    )

    // simulate first emission from validation listener
    mockEditStateSubject.next({
      id: 'example-id',
      draft: {
        _id: 'example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'exampleRev5',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 5,
      },
      transactionSyncLock: null,
      liveEdit: false,
      published: null,
      type: 'movie',
      ready: true,
    })

    const result = await subscription

    expect(result).toMatchObject([
      {
        isValidating: true,
        validation: [],
      },
      {
        isValidating: false,
        validation: [
          {
            item: {message: 'Expected type "String", got "Number"'},
            level: 'error',
            path: ['title'],
          },
        ],
      },
    ])

    const immediatePlayback = await firstValueFrom(
      validation(
        {client, schema} as any,
        {publishedId: 'example-id', draftId: 'drafts.example-id'},
        'movie',
      ),
    )

    const immediatePlaybackAgain = await firstValueFrom(
      validation(
        {client, schema} as any,
        {publishedId: 'example-id', draftId: 'drafts.example-id'},
        'movie',
      ),
    )

    expect(result[result.length - 1]).toEqual(immediatePlayback)
    expect(immediatePlayback).toEqual(immediatePlaybackAgain)
  })

  it.skip('returns empty validation message arrays if there is no available published or draft snapshot', async () => {
    const client = getMockClient()

    // Mock `editState`
    const mockEditStateSubject = new Subject<EditStateFor>()
    mockEditState.mockImplementation(() => mockEditStateSubject.asObservable())

    const {subscription, closeSubscription, doneValidating} = createSubscription(
      client,
      () => EMPTY,
    )

    mockEditStateSubject.next({
      id: 'example-id',
      draft: null,
      liveEdit: false,
      published: null,
      type: 'movie',
      ready: true,
      transactionSyncLock: null,
    })

    await doneValidating()
    closeSubscription()

    await expect(subscription).resolves.toMatchObject([{isValidating: false, validation: []}])
  })
})
