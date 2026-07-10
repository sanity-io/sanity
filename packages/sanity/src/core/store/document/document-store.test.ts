import {type SanityClient} from '@sanity/client'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getFallbackLocaleSource} from '../../i18n/fallback'
import {type DocumentPreviewStore} from '../../preview'
import {createSchema} from '../../schema'
import {type HistoryStore} from '../history'
import {editOperations} from './document-pair/editOperations'
import {type OperationsAPI} from './document-pair/operations'
import {createDocumentStore} from './document-store'
import {type DocumentPairTarget} from './types'

vi.mock('./document-pair/editOperations', () => ({editOperations: vi.fn()}))

const mockEditOperations = vi.mocked(editOperations)

const schema = createSchema({
  name: 'default',
  types: [{name: 'movie', type: 'document', fields: [{name: 'title', type: 'string'}]}],
})

let testId = 0

function createOperationsAPIStub(): OperationsAPI {
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

function setup() {
  // Unique project per test avoids the memoize caches keyed on client config.
  const config = {projectId: `project-${testId++}`, dataset: 'dataset'}
  const client = {config: () => config} as unknown as SanityClient

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

  return {store}
}

function collectFirst(
  store: ReturnType<typeof setup>['store'],
  target: string | DocumentPairTarget | undefined,
): OperationsAPI {
  const values: OperationsAPI[] = []
  const subscription = store.pair
    .editOperations('incoming-id', 'movie', target)
    .subscribe((value) => values.push(value))
  subscription.unsubscribe()
  return values[0]
}

describe('documentStore.pair.editOperations target handling', () => {
  beforeEach(() => {
    mockEditOperations.mockReset()
  })

  it('emits guarded (NOT_READY) operations for an unresolved target without checking out a pair', () => {
    const {store} = setup()

    const operations = collectFirst(store, {kind: 'unresolved'})

    expect(operations.patch.disabled).toBe('NOT_READY')
    expect(() => (operations.patch.execute as () => void)()).toThrowError(/before it was ready/)
    expect(mockEditOperations).not.toHaveBeenCalled()
  })

  it('emits TARGET_NOT_FOUND operations for a missing target without checking out a pair', () => {
    const {store} = setup()

    const operations = collectFirst(store, {kind: 'target-missing', variantId: '_.variants.alpha'})

    expect(operations.patch.disabled).toBe('TARGET_NOT_FOUND')
    expect(operations.publish.disabled).toBe('TARGET_NOT_FOUND')
    expect(() => (operations.publish.execute as () => void)()).toThrowError(
      /does not contain this document/,
    )
    expect(mockEditOperations).not.toHaveBeenCalled()
  })

  it('prepares the version pair id from a variant target scope', () => {
    const {store} = setup()
    mockEditOperations.mockReturnValue(of(createOperationsAPIStub()))

    collectFirst(store, {kind: 'variant', scopeId: 'varscope', variantId: '_.variants.alpha'})

    expect(mockEditOperations).toHaveBeenCalledWith(
      expect.anything(),
      {
        publishedId: 'incoming-id',
        draftId: 'drafts.incoming-id',
        versionId: 'versions.varscope.incoming-id',
      },
      'movie',
    )
  })

  it('keeps supporting a bare version name string', () => {
    const {store} = setup()
    mockEditOperations.mockReturnValue(of(createOperationsAPIStub()))

    collectFirst(store, 'release')

    expect(mockEditOperations).toHaveBeenCalledWith(
      expect.anything(),
      {
        publishedId: 'incoming-id',
        draftId: 'drafts.incoming-id',
        versionId: 'versions.release.incoming-id',
      },
      'movie',
    )
  })

  it('keeps the base pair when no target is provided', () => {
    const {store} = setup()
    mockEditOperations.mockReturnValue(of(createOperationsAPIStub()))

    collectFirst(store, undefined)

    expect(mockEditOperations).toHaveBeenCalledWith(
      expect.anything(),
      {publishedId: 'incoming-id', draftId: 'drafts.incoming-id'},
      'movie',
    )
  })
})
