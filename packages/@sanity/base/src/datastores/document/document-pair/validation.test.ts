import {SanityClient} from '@sanity/client'
import {concat, ConnectableObservable, timer, Observable, Subject, of} from 'rxjs'
import {buffer, takeWhile, first, publish, mapTo} from 'rxjs/operators'
import {DocumentPreviewStore} from '../../../preview'
import {createSchema} from '../../../schema'
import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {editState, EditStateFor} from './editState'
import {validation} from './validation'

// Mock `./editState`
const mockEditState = editState as jest.Mock<Observable<EditStateFor>, any[]>
jest.mock('./editState', () => ({editState: jest.fn()}))

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

// A fixture used to set up a validation stream/subscription and wait
// for certain events (e.g. when validation is finished running)
function createSubscription(client: SanityClient, documentPreviewStore?: DocumentPreviewStore) {
  const stream = validation(
    {client, documentPreviewStore, schema} as any,
    {publishedId: 'example-id', draftId: 'drafts.example-id'},
    'movie'
  ).pipe(publish())

  // Publish and connect this for the tests
  ;(stream as ConnectableObservable<unknown>).connect()

  // Create a subject we can use to notify via `done.next()`
  const done = new Subject()

  // Create a subscription that collects all emissions until `done.next()`
  const subscription = stream.pipe(buffer(done), first()).toPromise()

  return {
    subscription,
    closeSubscription: () => done.next(),
    doneValidating: () => {
      return stream.pipe(takeWhile((e) => e.isValidating, true)).toPromise()
    },
  }
}

describe('validation', () => {
  beforeEach(() => {
    mockEditState.mockReset()
  })

  it('runs `editState` through `validateDocument` to create a stream of validation statuses', async () => {
    const client = createMockSanityClient()
    const mockEditStateSubject = new Subject<EditStateFor>()

    mockEditState.mockImplementation(() => mockEditStateSubject.asObservable())

    const {subscription, closeSubscription, doneValidating} = createSubscription(client as any)

    // simulate first emission from validation listener
    mockEditStateSubject.next({
      id: 'example-id',
      draft: {
        _id: 'example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'exampleRev',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 5,
      },
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
  })

  it.skip('re-runs validation when the edit state changes', async () => {
    const client = createMockSanityClient()
    const mockEditStateSubject = new Subject<EditStateFor>()

    mockEditState.mockImplementation(() => mockEditStateSubject.asObservable())

    const {subscription, closeSubscription, doneValidating} = createSubscription(client as any)

    // simulate first emission from validation listener
    mockEditStateSubject.next({
      id: 'example-id',
      draft: {
        _id: 'example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'exampleRev',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 5,
      },
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
        _rev: 'exampleRev',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 'valid title',
      },
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
  })

  it.skip('re-runs validation when dependency events change', async () => {
    const client = createMockSanityClient()
    const subject = new Subject()
    const mockPreviewStore: any = {}

    // Mock `editState`
    const mockEditStateSubject = new Subject<EditStateFor>()
    mockEditState.mockImplementation(() => mockEditStateSubject.asObservable())

    const {subscription, closeSubscription, doneValidating} = createSubscription(
      client as any,
      mockPreviewStore
    )

    mockPreviewStore.unstable_observeDocumentPairAvailability = () =>
      concat(
        of({published: {available: true}}),
        subject.pipe(mapTo({published: {available: false}}))
      )

    // simulate first emission from validation listener
    mockEditStateSubject.next({
      id: 'example-id',
      draft: {
        _id: 'example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'exampleRev',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 'testing',
        exampleRef: {_ref: 'example-ref-id'},
        exampleRefTwo: {_ref: 'example-ref-other'},
      },
      liveEdit: false,
      published: null,
      type: 'movie',
      ready: true,
    })
    await doneValidating()

    mockPreviewStore.unstable_observeDocumentPairAvailability = (id: string) =>
      id === 'example-ref-id'
        ? of({published: {available: false}})
        : of({published: {available: true}})

    subject.next()

    await doneValidating()

    // close the buffer
    closeSubscription()

    await expect(subscription).resolves.toMatchObject([
      {isValidating: true, validation: []},
      {isValidating: false, validation: []},
      {isValidating: true, validation: []},
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
  })

  // this means that when you subscribe to the same document, you'll
  // immediately get the previous value emitted to you
  it.skip('replays the last known version via `memoize` and `publishReplay`', async () => {
    const client = createMockSanityClient()

    // Mock `editState`
    const mockEditStateSubject = new Subject<EditStateFor>()
    mockEditState.mockImplementation(() => mockEditStateSubject.asObservable())

    const subscription = validation(
      {client, schema} as any,
      {publishedId: 'example-id', draftId: 'drafts.example-id'},
      'movie'
    )
      .pipe(buffer(timer(500)))
      .toPromise()

    // simulate first emission from validation listener
    mockEditStateSubject.next({
      id: 'example-id',
      draft: {
        _id: 'example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'exampleRev',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 5,
      },
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

    const immediatePlayback = await validation(
      {client, schema} as any,
      {publishedId: 'example-id', draftId: 'drafts.example-id'},
      'movie'
    )
      .pipe(first())
      .toPromise()

    const immediatePlaybackAgain = await validation(
      {client, schema} as any,
      {publishedId: 'example-id', draftId: 'drafts.example-id'},
      'movie'
    )
      .pipe(first())
      .toPromise()

    expect(result[result.length - 1]).toEqual(immediatePlayback)
    expect(immediatePlayback).toEqual(immediatePlaybackAgain)
  })

  it.skip('returns empty validation message arrays if there is no available published or draft snapshot', async () => {
    const client = createMockSanityClient()

    // Mock `editState`
    const mockEditStateSubject = new Subject<EditStateFor>()
    mockEditState.mockImplementation(() => mockEditStateSubject.asObservable())

    const {subscription, closeSubscription, doneValidating} = createSubscription(client as any)

    mockEditStateSubject.next({
      id: 'example-id',
      draft: null,
      liveEdit: false,
      published: null,
      type: 'movie',
      ready: true,
    })

    await doneValidating()
    closeSubscription()

    await expect(subscription).resolves.toMatchObject([
      {isValidating: true, validation: []},
      {isValidating: false, validation: []},
    ])
  })
})
