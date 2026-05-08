import {type SanityClient} from '@sanity/client'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getFallbackLocaleSource} from '../../i18n/fallback'
import {type DocumentPreviewStore} from '../../preview'
import {createSchema} from '../../schema'
import {type HistoryStore} from '../history'
import {type DocumentVersionEvent} from './document-pair/checkoutPair'
import {documentEvents} from './document-pair/documentEvents'
import {editOperations} from './document-pair/editOperations'
import {editState, type EditStateFor} from './document-pair/editState'
import {type OperationsAPI} from './document-pair/operations'
import {createDocumentStore} from './document-store'

vi.mock('./document-pair/documentEvents', () => ({documentEvents: vi.fn()}))
vi.mock('./document-pair/editOperations', () => ({editOperations: vi.fn()}))
vi.mock('./document-pair/editState', () => {
  return {
    editState: vi.fn(),
    getInitialEditState: vi.fn(({publishedId, typeName, version}) => ({
      id: publishedId,
      type: typeName,
      transactionSyncLock: null,
      draft: null,
      published: null,
      version: null,
      liveEdit: Boolean(version),
      liveEditSchemaType: false,
      ready: false,
      release: version,
    })),
  }
})

const mockDocumentEvents = vi.mocked(documentEvents)
const mockEditOperations = vi.mocked(editOperations)
const mockEditState = vi.mocked(editState)

const schema = createSchema({
  name: 'default',
  types: [
    {
      name: 'movie',
      title: 'Movie',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})

let testId = 0

function createOperationsAPI(): OperationsAPI {
  const operation = {disabled: false as const, execute: vi.fn()}

  return {
    commit: operation,
    delete: operation,
    del: operation,
    publish: operation,
    patch: operation,
    discardChanges: operation,
    unpublish: operation,
    duplicate: operation,
    restore: operation,
  }
}

function createEditState(id: string, release?: string): EditStateFor {
  return {
    id,
    type: 'movie',
    transactionSyncLock: {enabled: false},
    draft: null,
    published: null,
    version: null,
    liveEdit: Boolean(release),
    liveEditSchemaType: false,
    ready: true,
    release,
  }
}

function setup() {
  const config = {
    projectId: `project-${testId++}`,
    dataset: 'dataset',
  }
  const client = {
    config: () => config,
  } as unknown as SanityClient

  const store = createDocumentStore({
    getClient: () => client,
    documentPreviewStore: {
      unstable_observeDocumentPairAvailability: vi.fn(),
    } as unknown as DocumentPreviewStore,
    historyStore: {} as unknown as HistoryStore,
    initialValueTemplates: [],
    schema,
    i18n: getFallbackLocaleSource(),
  })

  return {client, store}
}

describe('documentStore pair ID preparation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits guarded edit operations before using the prepared IDs', () => {
    const {store} = setup()
    const readyOperations = createOperationsAPI()
    const values: OperationsAPI[] = []
    mockEditOperations.mockReturnValue(of(readyOperations))

    const subscription = store.pair
      .editOperations('incoming-id', 'movie', 'release')
      .subscribe((value) => values.push(value))

    expect(values[0].commit.disabled).toBe('NOT_READY')
    expect(mockEditOperations).toHaveBeenCalledWith(
      expect.anything(),
      {
        publishedId: 'incoming-id',
        draftId: 'drafts.incoming-id',
        versionId: 'versions.release.incoming-id',
      },
      'movie',
    )
    expect(values[values.length - 1]).toBe(readyOperations)

    subscription.unsubscribe()
  })

  it('emits an initial edit state before using the prepared IDs', () => {
    const {store} = setup()
    const values: EditStateFor[] = []
    const resolvedEditState = createEditState('incoming-id', 'release')
    mockEditState.mockReturnValue(of(resolvedEditState))

    const subscription = store.pair
      .editState('incoming-id', 'movie', 'release')
      .subscribe((value) => values.push(value))

    expect(values[0]).toEqual({
      id: 'incoming-id',
      type: 'movie',
      transactionSyncLock: null,
      draft: null,
      published: null,
      version: null,
      liveEdit: true,
      liveEditSchemaType: false,
      ready: false,
      release: 'release',
    })
    expect(mockEditState).toHaveBeenCalledWith(
      expect.anything(),
      {
        publishedId: 'incoming-id',
        draftId: 'drafts.incoming-id',
        versionId: 'versions.release.incoming-id',
      },
      'movie',
    )
    expect(values[values.length - 1]).toBe(resolvedEditState)

    subscription.unsubscribe()
  })

  it('shares one prepared ID pair across pair observables for the same document', () => {
    const {store} = setup()
    mockEditOperations.mockReturnValue(of(createOperationsAPI()))
    mockEditState.mockReturnValue(of(createEditState('incoming-id', 'release')))

    const operationsSubscription = store.pair
      .editOperations('incoming-id', 'movie', 'release')
      .subscribe()
    const editStateSubscription = store.pair
      .editState('incoming-id', 'movie', 'release')
      .subscribe()

    expect(mockEditOperations).toHaveBeenCalledTimes(1)
    expect(mockEditState).toHaveBeenCalledTimes(1)
    expect(mockEditOperations.mock.calls[0][1]).toBe(mockEditState.mock.calls[0][1])

    operationsSubscription.unsubscribe()
    editStateSubscription.unsubscribe()
  })

  it('uses the prepared IDs before subscribing to document events', () => {
    const {store} = setup()
    const event = {type: 'welcome'} as unknown as DocumentVersionEvent
    const values: unknown[] = []
    mockDocumentEvents.mockReturnValue(of(event))

    const subscription = store.pair
      .documentEvents('incoming-id', 'movie')
      .subscribe((value) => values.push(value))

    expect(mockDocumentEvents).toHaveBeenCalledWith(
      expect.anything(),
      {
        publishedId: 'incoming-id',
        draftId: 'drafts.incoming-id',
      },
      'movie',
      {},
    )
    expect(values).toEqual([event])

    subscription.unsubscribe()
  })
})
