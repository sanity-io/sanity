import {type SanityClient} from '@sanity/client'
import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {
  BehaviorSubject,
  concat,
  type ConnectableObservable,
  defer,
  EMPTY,
  firstValueFrom,
  lastValueFrom,
  type Observable,
  of,
  ReplaySubject,
  Subject,
  throwError,
  timer,
} from 'rxjs'
import {
  buffer,
  filter,
  finalize,
  map,
  publish,
  share,
  startWith,
  takeWhile,
  tap,
} from 'rxjs/operators'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {getFallbackLocaleSource} from '../../../i18n/fallback'
import {
  type DocumentAvailability,
  type DraftsModelDocumentAvailability,
} from '../../../preview/types'
import {createSchema} from '../../../schema/createSchema'
import {type ValidationStatus} from '../../../validation'
import {type IdPair} from '../types'
import {checkedOutEditState, editState, type EditStateFor} from './editState'
import {validation, type ValidationListener} from './validation'

// Mock `./editState`
const mockEditState = editState as Mock<typeof editState>
const mockCheckedOutEditState = checkedOutEditState as Mock<typeof checkedOutEditState>
vi.mock('./editState', () => ({editState: vi.fn(), checkedOutEditState: vi.fn()}))

// What `checkedOutEditState` reports for each pair, like the registry `editState` fills
const checkedOutStates = new Map<string, BehaviorSubject<EditStateFor | null>>()

function getCheckedOutStates(idPair: IdPair) {
  const key = `${idPair.publishedId}-${idPair.versionId}`
  let states = checkedOutStates.get(key)
  if (!states) {
    states = new BehaviorSubject<EditStateFor | null>(null)
    checkedOutStates.set(key, states)
  }
  return states
}

/**
 * The pair's `editState` with `states$` as its snapshots: while subscribed, it reports a placeholder
 * and then every state to `checkedOutEditState`, and it reports `null` once unsubscribed.
 */
function checkedOutPair(idPair: IdPair, states$: Observable<EditStateFor>) {
  const checkedOut = getCheckedOutStates(idPair)
  return states$.pipe(
    startWith({...draftEditState(idPair.publishedId, undefined), ready: false}),
    tap((state) => checkedOut.next(state)),
    finalize(() => checkedOut.next(null)),
    share(),
  )
}

// counts the validation runs of `countedMovie` documents
let countedValidations = 0

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
    {
      name: 'adminMovie',
      title: 'Admin Movie',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {
          name: 'adminOnlyTitle',
          type: 'string',
          // @ts-expect-error -- pre-existing, fix later
          hidden: ({currentUser}) => currentUser?.id !== 'admin-user',
          // @ts-expect-error -- pre-existing, fix later
          validation: (Rule) =>
            // @ts-expect-error -- pre-existing, fix later
            Rule.custom((value, context) => {
              if (context.hidden) return true
              return value ? true : 'Admin title is required'
            }),
        },
      ],
    },
    defineType({
      name: 'countedMovie',
      title: 'Counted Movie',
      type: 'document',
      fields: [
        defineField({
          name: 'title',
          type: 'string',
          validation: (rule) =>
            rule.custom(() => {
              countedValidations += 1
              return true
            }),
        }),
      ],
    }),
  ],
})

const AVAILABLE: DocumentAvailability = {available: true, reason: 'READABLE'}
const NOT_FOUND: DocumentAvailability = {available: false, reason: 'NOT_FOUND'}

// A fixture used to set up a validation stream/subscription and wait
// for certain events (e.g. when validation is finished running)
function createSubscription(
  client: SanityClient,
  observeDocumentPairAvailability: (id: string) => Observable<DraftsModelDocumentAvailability>,
  options: {
    typeName?: string
    currentUser?: {id: string} | null
    documentId?: string
    listener?: ValidationListener
    observeDocument?: (id: string) => Observable<SanityDocument | undefined>
  } = {},
) {
  const getClient = () => client
  const {
    typeName = 'movie',
    currentUser,
    documentId = 'example-id',
    // most tests drive the document through the pair's `editState`, which `document` checks out
    listener = 'document',
    observeDocument = () => EMPTY,
  } = options

  const stream = validation(
    {
      client,
      getClient,
      schema,
      observeDocumentPairAvailability,
      observeDocument,
      i18n: getFallbackLocaleSource(),
      // @ts-expect-error -- pre-existing, fix later
      currentUser,
    },
    {publishedId: documentId, draftId: `drafts.${documentId}`},
    typeName,
    'draft',
    undefined,
    undefined,
    listener,
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  ).pipe(publish())

  // Publish and connect this for the tests
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
    waitFor: (predicate: (status: ValidationStatus) => boolean) =>
      firstValueFrom(stream.pipe(filter(predicate))),
  }
}

// The edit state the document pair reports for the draft of a movie, deleted when `undefined`
function draftEditState(publishedId: string, draft: SanityDocument | undefined): EditStateFor {
  return {
    id: publishedId,
    type: 'movie',
    transactionSyncLock: null,
    draft: draft ?? null,
    published: null,
    version: null,
    liveEdit: false,
    liveEditSchemaType: false,
    ready: true,
    release: undefined,
    scopeId: undefined,
  }
}

// A fixture for version validation streams
function createVersionSubscription(
  client: SanityClient,
  versionId: string,
  observeDocumentPairAvailability: (id: string) => Observable<DraftsModelDocumentAvailability>,
) {
  const getClient = () => client

  const stream = validation(
    {
      client,
      getClient,
      schema,
      observeDocumentPairAvailability,
      observeDocument: () => EMPTY,
      i18n: getFallbackLocaleSource(),
    },
    {publishedId: 'example-id', draftId: 'drafts.example-id', versionId},
    'movie',
    'version',
    undefined,
    undefined,
    'document',
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  ).pipe(publish())

  // Publish and connect this for the tests
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
    mockCheckedOutEditState.mockImplementation((_client, idPair) =>
      getCheckedOutStates(idPair).asObservable(),
    )
  })

  it('runs `editState` through `validateDocument` to create a stream of validation statuses', async () => {
    const client = getMockClient()
    const mockEditStateSubject = new Subject<EditStateFor>()

    mockEditState.mockImplementation((_ctx, idPair) => checkedOutPair(idPair, mockEditStateSubject))

    const {subscription, closeSubscription, doneValidating} = createSubscription(
      client,
      () => EMPTY,
    )

    // simulate first emission from validation listener
    // @ts-expect-error -- pre-existing, fix later
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

    mockEditState.mockImplementation((_ctx, idPair) => checkedOutPair(idPair, mockEditStateSubject))

    const {subscription, closeSubscription, doneValidating} = createSubscription(
      client,
      () => EMPTY,
    )

    // simulate first emission from validation listener
    // @ts-expect-error -- pre-existing, fix later
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
    // @ts-expect-error -- pre-existing, fix later
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
    mockEditState.mockImplementation((_ctx, idPair) => checkedOutPair(idPair, mockEditStateSubject))

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
    // @ts-expect-error -- pre-existing, fix later
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
    mockEditState.mockImplementation((_ctx, idPair) => checkedOutPair(idPair, mockEditStateSubject))

    const subscription = lastValueFrom(
      validation(
        {
          client,
          schema,
          getClient: () => client,
          observeDocumentPairAvailability: vi.fn(() => EMPTY),
          observeDocument: () => EMPTY,
          i18n: getFallbackLocaleSource(),
        },
        {publishedId: 'example-id', draftId: 'drafts.example-id'},
        'movie',
        'draft',
      ).pipe(buffer(timer(500))),
    )

    // simulate first emission from validation listener
    // @ts-expect-error -- pre-existing, fix later
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
        'draft',
      ),
    )

    const immediatePlaybackAgain = await firstValueFrom(
      validation(
        {client, schema} as any,
        {publishedId: 'example-id', draftId: 'drafts.example-id'},
        'movie',
        'draft',
      ),
    )

    expect(result[result.length - 1]).toEqual(immediatePlayback)
    expect(immediatePlayback).toEqual(immediatePlaybackAgain)
  })

  it.skip('returns empty validation message arrays if there is no available published or draft snapshot', async () => {
    const client = getMockClient()

    // Mock `editState`
    const mockEditStateSubject = new Subject<EditStateFor>()
    mockEditState.mockImplementation((_ctx, idPair) => checkedOutPair(idPair, mockEditStateSubject))

    const {subscription, closeSubscription, doneValidating} = createSubscription(
      client,
      () => EMPTY,
    )

    // @ts-expect-error -- pre-existing, fix later
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

  it('creates separate cache entries for different document versions', async () => {
    const client = getMockClient()

    const summerEditStateSubject = new Subject<EditStateFor>()
    const winterEditStateSubject = new Subject<EditStateFor>()

    mockEditState.mockImplementation((_ctx, idPair) => {
      if (idPair.versionId === 'versions.summer.example-id') {
        return checkedOutPair(idPair, summerEditStateSubject)
      }
      return checkedOutPair(idPair, winterEditStateSubject)
    })

    const {
      subscription: summerSubscription,
      closeSubscription: closeSummerSubscription,
      doneValidating: summerDoneValidating,
    } = createVersionSubscription(client, 'versions.summer.example-id', () => EMPTY)

    const {
      subscription: winterSubscription,
      closeSubscription: closeWinterSubscription,
      doneValidating: winterDoneValidating,
    } = createVersionSubscription(client, 'versions.winter.example-id', () => EMPTY)

    // @ts-expect-error -- pre-existing, fix later
    summerEditStateSubject.next({
      id: 'example-id',
      version: {
        _id: 'versions.summer.example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'summerRev1',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 5, // Invalid: should be string
      },
      draft: null,
      published: null,
      transactionSyncLock: null,
      liveEdit: false,
      liveEditSchemaType: false,
      release: undefined,
      type: 'movie',
      ready: true,
    })

    // @ts-expect-error -- pre-existing, fix later
    winterEditStateSubject.next({
      id: 'example-id',
      version: {
        _id: 'versions.winter.example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'winterRev1',
        _type: 'movie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 'Valid Winter Title', // Valid
      },
      draft: null,
      published: null,
      transactionSyncLock: null,
      liveEdit: false,
      liveEditSchemaType: false,
      release: undefined,
      type: 'movie',
      ready: true,
    })

    await summerDoneValidating()
    await winterDoneValidating()

    closeSummerSubscription()
    closeWinterSubscription()

    const summerResults = await summerSubscription
    const winterResults = await winterSubscription

    expect(summerResults[summerResults.length - 1]).toMatchObject({
      isValidating: false,
      validation: [
        {
          item: {message: 'Expected type "String", got "Number"'},
          level: 'error',
          path: ['title'],
        },
      ],
    })

    expect(winterResults[winterResults.length - 1]).toMatchObject({
      isValidating: false,
      validation: [],
    })

    expect(mockEditState).toHaveBeenCalledTimes(2)

    summerEditStateSubject.complete()
    winterEditStateSubject.complete()
  })

  it('resolves hidden-field validation with currentUser in context', async () => {
    const client = getMockClient()
    const mockEditStateSubject = new Subject<EditStateFor>()

    mockEditState.mockImplementation((_ctx, idPair) => checkedOutPair(idPair, mockEditStateSubject))

    const adminSubscription = createSubscription(client, () => EMPTY, {
      typeName: 'adminMovie',
      currentUser: {id: 'admin-user'},
    })

    // @ts-expect-error -- pre-existing, fix later
    mockEditStateSubject.next({
      id: 'example-id',
      draft: {
        _id: 'drafts.example-id',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'adminRev1',
        _type: 'adminMovie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 'Admin doc',
      },
      transactionSyncLock: null,
      liveEdit: false,
      published: null,
      type: 'adminMovie',
      ready: true,
    })

    await adminSubscription.doneValidating()
    adminSubscription.closeSubscription()
    const adminResults = await adminSubscription.subscription

    expect(adminResults[adminResults.length - 1]).toMatchObject({
      isValidating: false,
      validation: [
        {
          item: {message: 'Admin title is required'},
          level: 'error',
          path: ['adminOnlyTitle'],
        },
      ],
    })

    const nonAdminSubscription = createSubscription(client, () => EMPTY, {
      typeName: 'adminMovie',
      currentUser: {id: 'non-admin-user'},
      documentId: 'example-id-two',
    })

    // @ts-expect-error -- pre-existing, fix later
    mockEditStateSubject.next({
      id: 'example-id-two',
      draft: {
        _id: 'drafts.example-id-two',
        _createdAt: '2021-09-07T16:23:52.256Z',
        _rev: 'adminRev2',
        _type: 'adminMovie',
        _updatedAt: '2021-09-07T16:23:52.256Z',
        title: 'Non-admin doc',
      },
      transactionSyncLock: null,
      liveEdit: false,
      published: null,
      type: 'adminMovie',
      ready: true,
    })

    await nonAdminSubscription.doneValidating()
    nonAdminSubscription.closeSubscription()
    const nonAdminResults = await nonAdminSubscription.subscription

    expect(nonAdminResults[nonAdminResults.length - 1]).toMatchObject({
      isValidating: false,
      validation: [],
    })

    mockEditStateSubject.complete()
  })

  describe('memoization by currentUser', () => {
    it('returns DISTINCT observables for different currentUser ids', () => {
      const client = getMockClient()
      const mockEditStateSubject = new Subject<EditStateFor>()
      mockEditState.mockImplementation((_ctx, idPair) =>
        checkedOutPair(idPair, mockEditStateSubject),
      )

      // Use a random published id to avoid collisions with the module-level cache from other tests
      const publishedId = `movie-${Math.random().toString(36).slice(2)}`
      const idPair = {publishedId, draftId: `drafts.${publishedId}`}
      const sharedCtx = {
        client,
        getClient: () => client,
        schema,
        observeDocumentPairAvailability: () => EMPTY,
        observeDocument: () => EMPTY,
        i18n: getFallbackLocaleSource(),
      }

      const observableUserA = validation(
        // @ts-expect-error -- pre-existing, fix later
        {...sharedCtx, currentUser: {id: 'user-a'}},
        idPair,
        'movie',
        'draft',
      )
      const observableUserB = validation(
        // @ts-expect-error -- pre-existing, fix later
        {...sharedCtx, currentUser: {id: 'user-b'}},
        idPair,
        'movie',
        'draft',
      )

      expect(observableUserA).not.toBe(observableUserB)
    })

    it('returns the SAME observable for the same currentUser id regardless of the deprecated reference flag', () => {
      const client = getMockClient()
      const mockEditStateSubject = new Subject<EditStateFor>()
      mockEditState.mockImplementation((_ctx, idPair) =>
        checkedOutPair(idPair, mockEditStateSubject),
      )

      const publishedId = `movie-${Math.random().toString(36).slice(2)}`
      const idPair = {publishedId, draftId: `drafts.${publishedId}`}
      const sharedCtx = {
        client,
        getClient: () => client,
        schema,
        observeDocumentPairAvailability: () => EMPTY,
        observeDocument: () => EMPTY,
        i18n: getFallbackLocaleSource(),
        currentUser: {id: 'user-c'},
      }

      // @ts-expect-error -- pre-existing, fix later
      const firstObservable = validation(sharedCtx, idPair, 'movie', 'draft', true)
      // @ts-expect-error -- pre-existing, fix later
      const secondObservable = validation(sharedCtx, idPair, 'movie', 'draft', false)

      expect(firstObservable).toBe(secondObservable)
    })

    it('returns DISTINCT observables for null vs defined currentUser', () => {
      const client = getMockClient()
      const mockEditStateSubject = new Subject<EditStateFor>()
      mockEditState.mockImplementation((_ctx, idPair) =>
        checkedOutPair(idPair, mockEditStateSubject),
      )

      const publishedId = `movie-${Math.random().toString(36).slice(2)}`
      const idPair = {publishedId, draftId: `drafts.${publishedId}`}
      const sharedCtx = {
        client,
        getClient: () => client,
        schema,
        observeDocumentPairAvailability: () => EMPTY,
        observeDocument: () => EMPTY,
        i18n: getFallbackLocaleSource(),
      }

      const observableWithUser = validation(
        // @ts-expect-error -- pre-existing, fix later
        {...sharedCtx, currentUser: {id: 'user-d'}},
        idPair,
        'movie',
        'draft',
      )
      const observableWithoutUser = validation(
        {...sharedCtx, currentUser: null},
        idPair,
        'movie',
        'draft',
      )

      expect(observableWithUser).not.toBe(observableWithoutUser)
    })
  })

  describe('global listener', () => {
    const movie = {
      _createdAt: '2021-09-07T16:23:52.256Z',
      _type: 'movie',
      _updatedAt: '2021-09-07T16:23:52.256Z',
    }

    it('validates the document `observeDocument` reports, without checking out the document pair', async () => {
      const client = getMockClient()
      const documentId = `movie-${Math.random().toString(36).slice(2)}`
      const document$ = new Subject<SanityDocument>()
      const observeDocument = vi.fn((_id: string) => document$.asObservable())

      const {subscription, closeSubscription, doneValidating} = createSubscription(
        client,
        () => EMPTY,
        {documentId, listener: 'global', observeDocument},
      )

      document$.next({...movie, _id: `drafts.${documentId}`, _rev: 'globalRev1', title: 5})
      await doneValidating()
      closeSubscription()

      await expect(subscription).resolves.toMatchObject([
        {isValidating: true, validation: [], revision: 'globalRev1'},
        {
          isValidating: false,
          validation: [
            {
              item: {message: 'Expected type "String", got "Number"'},
              level: 'error',
              path: ['title'],
            },
          ],
          revision: 'globalRev1',
        },
      ])
      expect(observeDocument).toHaveBeenCalledWith(`drafts.${documentId}`)
      expect(mockEditState).not.toHaveBeenCalled()
      document$.complete()
    })

    it('retries a failed `observeDocument` instead of erroring the validation', async () => {
      vi.useFakeTimers({shouldAdvanceTime: true})
      try {
        const client = getMockClient()
        const documentId = `movie-${Math.random().toString(36).slice(2)}`
        let attempts = 0
        const observeDocument = () =>
          defer(() => {
            attempts += 1
            return attempts === 1
              ? throwError(() => new Error('503 Service Unavailable'))
              : of({...movie, _id: `drafts.${documentId}`, _rev: 'globalRev1', title: 5})
          })

        const {subscription, closeSubscription, doneValidating} = createSubscription(
          client,
          () => EMPTY,
          {documentId, listener: 'global', observeDocument},
        )
        const done = doneValidating()
        await vi.advanceTimersByTimeAsync(1000)
        const status = await done
        closeSubscription()

        expect(attempts).toBe(2)
        expect(status).toMatchObject({
          isValidating: false,
          validation: [{item: {message: 'Expected type "String", got "Number"'}}],
          revision: 'globalRev1',
        })
        await expect(subscription).resolves.toBeDefined()
      } finally {
        vi.useRealTimers()
      }
    })

    it('stops retrying a global document load after three failures and errors the validation', async () => {
      vi.useFakeTimers({shouldAdvanceTime: true})
      try {
        const client = getMockClient()
        const documentId = `movie-${Math.random().toString(36).slice(2)}`
        let attempts = 0
        const observeDocument = () =>
          defer(() => {
            attempts += 1
            return throwError(() => new Error('503 Service Unavailable'))
          })

        const {subscription, closeSubscription} = createSubscription(client, () => EMPTY, {
          documentId,
          listener: 'global',
          observeDocument,
        })
        // Attach before the retries elapse. The stream rejects during the timer
        // flush, and a handler attached afterwards is already too late.
        const rejected = expect(subscription).rejects.toThrow('503 Service Unavailable')
        // one attempt plus three retries, delayed 1s + 2s + 3s
        await vi.advanceTimersByTimeAsync(6_000)
        closeSubscription()

        await rejected
        expect(attempts).toBe(4)
        expect(mockEditState).not.toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })

    it.each(['document', 'global'] as const)(
      'reads a changed document as validating until its own result arrives (%s listener)',
      async (listener) => {
        const client = getMockClient()
        const documentId = `movie-${Math.random().toString(36).slice(2)}`
        const draftId = `drafts.${documentId}`
        const document$ = new Subject<SanityDocument>()
        mockEditState.mockImplementation((_ctx, idPair) =>
          checkedOutPair(idPair, document$.pipe(map((draft) => draftEditState(documentId, draft)))),
        )

        const {subscription, closeSubscription, doneValidating, waitFor} = createSubscription(
          client,
          () => EMPTY,
          {documentId, listener, observeDocument: () => document$.asObservable()},
        )

        document$.next({...movie, _id: draftId, _rev: 'rev1', title: 5})
        await doneValidating()

        // a change that arrives from the server changes the content and the revision at once
        document$.next({...movie, _id: draftId, _rev: 'rev2', title: 'A valid title'})
        await waitFor((status) => !status.isValidating && status.validation.length === 0)
        closeSubscription()

        const statuses = await subscription
        const afterChange = statuses.slice(statuses.findIndex((status) => !status.isValidating) + 1)
        expect(afterChange.slice(0, -1).filter((status) => !status.isValidating)).toEqual([])
        expect(afterChange).toContainEqual(
          expect.objectContaining({isValidating: true, revision: 'rev2'}),
        )
        expect(afterChange[afterChange.length - 1]).toMatchObject({
          isValidating: false,
          validation: [],
          revision: 'rev2',
        })
        document$.complete()
      },
    )

    it.each(['document', 'global'] as const)(
      'reads a deleted document as done validating (%s listener)',
      async (listener) => {
        const client = getMockClient()
        const documentId = `movie-${Math.random().toString(36).slice(2)}`
        const document$ = new Subject<SanityDocument | undefined>()
        mockEditState.mockImplementation((_ctx, idPair) =>
          checkedOutPair(idPair, document$.pipe(map((draft) => draftEditState(documentId, draft)))),
        )

        const {closeSubscription, doneValidating, waitFor} = createSubscription(
          client,
          () => EMPTY,
          {documentId, listener, observeDocument: () => document$.asObservable()},
        )

        document$.next({...movie, _id: `drafts.${documentId}`, _rev: 'rev1', title: 5})
        await doneValidating()

        // the run for a document without a `_type` reports no revision
        document$.next(undefined)
        const status = await waitFor((next) => next.validation.length === 0)
        closeSubscription()

        expect(status).toEqual({isValidating: false, validation: [], revision: undefined})
        document$.complete()
      },
    )

    it('caches one stream per listener, with `auto` as the default', () => {
      const client = getMockClient()
      mockEditState.mockImplementation(() => EMPTY)
      const publishedId = `movie-${Math.random().toString(36).slice(2)}`
      const idPair = {publishedId, draftId: `drafts.${publishedId}`}
      const ctx = {
        client,
        getClient: () => client,
        schema,
        observeDocumentPairAvailability: () => EMPTY,
        observeDocument: () => EMPTY,
        i18n: getFallbackLocaleSource(),
        currentUser: null,
      }
      const forListener = (listener?: ValidationListener) =>
        validation(ctx, idPair, 'movie', 'draft', undefined, undefined, listener)

      const autoValidation = forListener()
      const pairValidation = forListener('document')
      const globalValidation = forListener('global')

      expect(forListener('auto')).toBe(autoValidation)
      expect(forListener('document')).toBe(pairValidation)
      expect(forListener('global')).toBe(globalValidation)
      expect(new Set([autoValidation, pairValidation, globalValidation]).size).toBe(3)
    })
  })

  describe('auto listener', () => {
    const movie = {
      _createdAt: '2021-09-07T16:23:52.256Z',
      _type: 'movie',
      _updatedAt: '2021-09-07T16:23:52.256Z',
    }
    const invalidTitle = {item: {message: 'Expected type "String", got "Number"'}}

    function setup() {
      const documentId = `movie-${Math.random().toString(36).slice(2)}`
      const draftId = `drafts.${documentId}`
      const idPair = {publishedId: documentId, draftId}
      // the snapshots of the pair, replayed to whoever checks it out
      const pairDraft$ = new ReplaySubject<SanityDocument>(1)
      const pair$ = checkedOutPair(
        idPair,
        pairDraft$.pipe(map((draft) => draftEditState(documentId, draft))),
      )
      // what a document pane would do
      const checkOutPair = () => pair$.subscribe()
      return {documentId, draftId, pairDraft$, checkOutPair}
    }

    it('validates the checked out pair without reading the global listener', async () => {
      const {documentId, draftId, pairDraft$, checkOutPair} = setup()
      const observeDocument = vi.fn(() => EMPTY)
      pairDraft$.next({...movie, _id: draftId, _rev: 'pairRev1', title: 5})
      const pane = checkOutPair()

      const {closeSubscription, doneValidating} = createSubscription(getMockClient(), () => EMPTY, {
        documentId,
        listener: 'auto',
        observeDocument,
      })
      const status = await doneValidating()
      closeSubscription()

      expect(status).toMatchObject({validation: [invalidTitle], revision: 'pairRev1'})
      expect(observeDocument).not.toHaveBeenCalled()
      expect(mockEditState).not.toHaveBeenCalled()
      pane.unsubscribe()
    })

    it('validates through the global listener while no pair is checked out', async () => {
      const {documentId, draftId} = setup()
      const observeDocument = vi.fn((_id: string) =>
        of({...movie, _id: draftId, _rev: 'globalRev1', title: 5}),
      )

      const {closeSubscription, doneValidating} = createSubscription(getMockClient(), () => EMPTY, {
        documentId,
        listener: 'auto',
        observeDocument,
      })
      const status = await doneValidating()
      closeSubscription()

      expect(status).toMatchObject({validation: [invalidTitle], revision: 'globalRev1'})
      expect(observeDocument).toHaveBeenCalledWith(draftId)
      expect(mockEditState).not.toHaveBeenCalled()
    })

    it('uses a pair checked out in the same tick as the subscription', async () => {
      const {documentId, draftId, pairDraft$, checkOutPair} = setup()
      const observeDocument = vi.fn(() => EMPTY)
      pairDraft$.next({...movie, _id: draftId, _rev: 'pairRev1', title: 5})

      const {closeSubscription, doneValidating} = createSubscription(getMockClient(), () => EMPTY, {
        documentId,
        listener: 'auto',
        observeDocument,
      })
      // a document action subscribes a moment before its pane checks the pair out
      const pane = checkOutPair()
      const status = await doneValidating()
      closeSubscription()

      expect(status).toMatchObject({validation: [invalidTitle], revision: 'pairRev1'})
      expect(observeDocument).not.toHaveBeenCalled()
      pane.unsubscribe()
    })

    it('switches to a pair checked out later, without validating its placeholder', async () => {
      const {documentId, draftId, pairDraft$, checkOutPair} = setup()
      const observeDocument = () => of({...movie, _id: draftId, _rev: 'globalRev1', title: 5})

      const {subscription, closeSubscription, doneValidating, waitFor} = createSubscription(
        getMockClient(),
        () => EMPTY,
        {documentId, listener: 'auto', observeDocument},
      )
      await doneValidating()

      // the pair reports its placeholder until its snapshots arrive
      const pane = checkOutPair()
      await firstValueFrom(timer(50))
      pairDraft$.next({...movie, _id: draftId, _rev: 'pairRev2', title: 'A valid title'})
      await waitFor((status) => !status.isValidating && status.revision === 'pairRev2')
      closeSubscription()

      const statuses = await subscription
      const globalResult = statuses.findIndex((status) => !status.isValidating)
      const beforePairResult = statuses.slice(globalResult + 1, -1)
      expect(statuses[globalResult]).toMatchObject({
        validation: [invalidTitle],
        revision: 'globalRev1',
      })
      expect(beforePairResult.filter((status) => !status.isValidating)).toEqual([])
      expect(statuses.every((status) => status.revision !== undefined)).toBe(true)
      expect(statuses[statuses.length - 1]).toMatchObject({validation: [], revision: 'pairRev2'})
      pane.unsubscribe()
    })

    it('falls back to the global listener once the pair is released', async () => {
      const {documentId, draftId, pairDraft$, checkOutPair} = setup()
      const observeDocument = vi.fn((_id: string) =>
        of({...movie, _id: draftId, _rev: 'globalRev2', title: 'A valid title'}),
      )
      pairDraft$.next({...movie, _id: draftId, _rev: 'pairRev1', title: 5})
      const pane = checkOutPair()

      const {closeSubscription, doneValidating, waitFor} = createSubscription(
        getMockClient(),
        () => EMPTY,
        {documentId, listener: 'auto', observeDocument},
      )
      await doneValidating()
      expect(observeDocument).not.toHaveBeenCalled()

      pane.unsubscribe()
      const status = await waitFor((next) => !next.isValidating && next.revision === 'globalRev2')
      closeSubscription()

      expect(status).toMatchObject({validation: []})
      expect(observeDocument).toHaveBeenCalledWith(draftId)
    })

    /**
     * Validates a `countedMovie` draft with each listener in turn, each subscription kept open
     * while the next one waits for its result.
     */
    async function validateWithEach(
      setupResult: ReturnType<typeof setup>,
      observeDocument: (id: string) => Observable<SanityDocument | undefined>,
      listeners: ValidationListener[],
      revision: string,
    ) {
      const client = getMockClient()
      const ctx = {
        client,
        getClient: () => client,
        schema,
        observeDocumentPairAvailability: () => EMPTY,
        observeDocument,
        i18n: getFallbackLocaleSource(),
        currentUser: null,
      }
      const idPair = {publishedId: setupResult.documentId, draftId: setupResult.draftId}
      const forListener = (listener: ValidationListener) =>
        validation(ctx, idPair, 'countedMovie', 'draft', undefined, undefined, listener)

      const subscriptions = []
      for (const listener of listeners) {
        subscriptions.push(forListener(listener).subscribe())
        await firstValueFrom(
          forListener(listener).pipe(
            filter((status) => !status.isValidating && status.revision === revision),
          ),
        )
      }
      // last first: the pair outlives every reader that doesn't hold it
      for (const subscription of subscriptions.toReversed()) subscription.unsubscribe()
    }

    it('shares the pair run with `document` while the pair is checked out', async () => {
      const setupResult = setup()
      const {documentId, draftId, pairDraft$} = setupResult
      pairDraft$.next({...movie, _type: 'countedMovie', _id: draftId, _rev: 'pairRev1'})
      mockEditState.mockReturnValue(
        checkedOutPair(
          {publishedId: documentId, draftId},
          pairDraft$.pipe(map((draft) => draftEditState(documentId, draft))),
        ),
      )
      const observeDocument = vi.fn(() => EMPTY)
      countedValidations = 0

      await validateWithEach(setupResult, observeDocument, ['document', 'auto'], 'pairRev1')

      expect(countedValidations).toBe(1)
      expect(observeDocument).not.toHaveBeenCalled()
    })

    it('shares the global run with `global` while no pair is checked out', async () => {
      const setupResult = setup()
      const observeDocument = vi.fn((_id: string) =>
        of({...movie, _type: 'countedMovie', _id: setupResult.draftId, _rev: 'globalRev1'}),
      )
      countedValidations = 0

      await validateWithEach(setupResult, observeDocument, ['global', 'auto'], 'globalRev1')

      expect(countedValidations).toBe(1)
      expect(observeDocument).toHaveBeenCalledTimes(1)
    })
  })
})
