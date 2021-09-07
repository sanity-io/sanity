/* eslint-disable max-nested-callbacks */
import {ConnectableObservable, Subject, timer, Observable, concat, of} from 'rxjs'
import {buffer, takeWhile, first, publish, mapTo} from 'rxjs/operators'
import type {EditStateFor} from './editState'

type VersionedClient = typeof import('../../../client/versionedClient').versionedClient
type Validation = typeof import('./validation').validation
type ObservePaths = typeof import('../../../preview').observePaths

let mockVersionedClient: VersionedClient
let mockObserverPaths: ObservePaths
let validation: Validation
let mockEditStateSubject: Subject<EditStateFor>
let mockObservePaths: jest.MockedFunction<ObservePaths>

// setup tests that are independent on the module level.
// each test run shares no state.
beforeEach(() => {
  // since this module is a singleton, we want to reset for every test
  // https://stackoverflow.com/a/48990084/5776910
  jest.resetModules()

  // schema mock
  jest.mock('part:@sanity/base/schema', () => {
    const createSchema = jest.requireActual('part:@sanity/base/schema-creator')
    const movie = {
      name: 'movie',
      title: 'Movie',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'exampleRef', type: 'reference', to: [{type: 'movie'}]},
        {name: 'exampleRefTwo', type: 'reference', to: [{type: 'movie'}]},
      ],
    }
    return createSchema({types: [movie]})
  })

  // versioned client mock
  mockVersionedClient = ({fetch: jest.fn()} as unknown) as VersionedClient
  jest.mock('../../../client/versionedClient', () => ({
    versionedClient: mockVersionedClient,
  }))

  // observe paths mock
  mockObservePaths = jest.fn((() => new Observable()) as ObservePaths)
  jest.mock('../../../preview', () => ({
    observePaths: mockObservePaths,
  }))

  // edit state mock
  mockEditStateSubject = new Subject()
  jest.mock('./editState', () => ({editState: jest.fn(() => mockEditStateSubject)}))

  // then require the module we're testing. this must be done last.
  validation = jest.requireActual('./validation').validation
})

// a small fixture used to set up a validation stream/subscription and wait
// for certain events (e.g. when validation is finished running)
function createSubscription() {
  const stream = validation(
    {publishedId: 'example-id', draftId: 'drafts.example-id'},
    'movie'
  ).pipe(publish())

  // publish and connect this for the tests
  ;(stream as ConnectableObservable<unknown>).connect()

  // create a subject we can use to notify via `done.next()`
  const done = new Subject()
  // create a subscription that collects all emissions until `done.next()`
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
  it('runs `editState` through `validateDocument` to create a stream of validation statuses', async () => {
    const {subscription, closeSubscription, doneValidating} = createSubscription()

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
      published: undefined,
      type: 'movie',
      ready: true,
    })

    await doneValidating()
    closeSubscription()

    await expect(subscription).resolves.toMatchObject([
      {
        isValidating: true,
        markers: [],
      },
      {
        isValidating: false,
        markers: [
          {
            item: {message: 'Expected type "String", got "Number"'},
            level: 'error',
            path: ['title'],
            type: 'validation',
          },
        ],
      },
    ])
  })

  it('re-runs validation when the edit state changes', async () => {
    const {subscription, closeSubscription, doneValidating} = createSubscription()

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
      published: undefined,
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
      published: undefined,
      type: 'movie',
      ready: true,
    })
    await doneValidating()

    closeSubscription()

    await expect(subscription).resolves.toMatchObject([
      {isValidating: true, markers: []},
      {isValidating: false, markers: [{item: {message: 'Expected type "String", got "Number"'}}]},
      {isValidating: true, markers: [{item: {message: 'Expected type "String", got "Number"'}}]},
      {isValidating: false, markers: []},
    ])
  })

  it('re-runs validation when dependency events change', async () => {
    const {subscription, closeSubscription, doneValidating} = createSubscription()

    const subject = new Subject()

    mockObservePaths.mockImplementation(((id: string) =>
      concat(
        //
        of({_id: id, _rev: 'exists'}),
        subject.pipe(mapTo(null))
      )) as ObservePaths)

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
      published: undefined,
      type: 'movie',
      ready: true,
    })
    await doneValidating()

    mockObservePaths.mockImplementation(((id: string) =>
      id === 'example-ref-id' ? of(null) : of({_id: id, _rev: 'exists'})) as ObservePaths)
    subject.next()

    await doneValidating()

    // close the buffer
    closeSubscription()

    await expect(subscription).resolves.toMatchObject([
      {isValidating: true, markers: []},
      {isValidating: false, markers: []},
      {isValidating: true, markers: []},
      {
        isValidating: false,
        markers: [
          {
            item: {message: /.+/},
            level: 'error',
            path: ['exampleRef'],
            type: 'validation',
          },
        ],
      },
    ])
  })

  // this means that when you subscribe to the same document, you'll
  // immediately get the previous value emitted to you
  it('replays the last known version via `memoize` and `publishReplay`', async () => {
    const subscription = validation(
      {publishedId: 'example-id', draftId: 'drafts.example-id'},
      'movie'
    )
      .pipe(buffer(timer(100)))
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
      published: undefined,
      type: 'movie',
      ready: true,
    })

    const result = await subscription

    expect(result).toMatchObject([
      {
        isValidating: true,
        markers: [],
      },
      {
        isValidating: false,
        markers: [
          {
            item: {message: 'Expected type "String", got "Number"'},
            level: 'error',
            path: ['title'],
            type: 'validation',
          },
        ],
      },
    ])

    const immediatePlayback = await validation(
      {publishedId: 'example-id', draftId: 'drafts.example-id'},
      'movie'
    )
      .pipe(first())
      .toPromise()

    const immediatePlaybackAgain = await validation(
      {publishedId: 'example-id', draftId: 'drafts.example-id'},
      'movie'
    )
      .pipe(first())
      .toPromise()

    expect(result[result.length - 1]).toEqual(immediatePlayback)
    expect(immediatePlayback).toEqual(immediatePlaybackAgain)
  })

  it('returns empty markers if there is no available published or draft snapshot', async () => {
    const {subscription, closeSubscription, doneValidating} = createSubscription()

    mockEditStateSubject.next({
      id: 'example-id',
      draft: undefined,
      liveEdit: false,
      published: undefined,
      type: 'movie',
      ready: true,
    })

    await doneValidating()
    closeSubscription()

    await expect(subscription).resolves.toMatchObject([
      {isValidating: true, markers: []},
      {isValidating: false, markers: []},
    ])
  })
})
