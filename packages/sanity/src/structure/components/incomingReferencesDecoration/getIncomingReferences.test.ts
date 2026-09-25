import {firstValueFrom, of, throwError} from 'rxjs'
import {type DocumentPreviewStore, type SanityClient} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {getIncomingReferences, resolveIncomingReferencesFilter} from './getIncomingReferences'

const getClient = (() => ({})) as unknown as (options: {apiVersion: string}) => SanityClient

const storeWith = (doc: unknown): DocumentPreviewStore =>
  ({
    unstable_observeDocument: vi.fn(() => of(doc)),
  }) as unknown as DocumentPreviewStore

describe('resolveIncomingReferencesFilter', () => {
  it('passes a static string filter and params straight through', async () => {
    const result = await firstValueFrom(
      resolveIncomingReferencesFilter({
        documentId: 'doc1',
        documentPreviewStore: storeWith({_rev: 'r1'}),
        getClient,
        filter: 'status == "active"',
        filterParams: {brand: 'Random House'},
      }),
    )

    expect(result).toEqual({filter: 'status == "active"', filterParams: {brand: 'Random House'}})
  })

  it('resolves a function filter that returns a string', async () => {
    const result = await firstValueFrom(
      resolveIncomingReferencesFilter({
        documentId: 'doc1',
        documentPreviewStore: storeWith({_rev: 'r1'}),
        getClient,
        filter: () => 'status == "active"',
        filterParams: {brand: 'Random House'},
      }),
    )

    // the function returned a bare string, so the configured filterParams are retained
    expect(result).toEqual({filter: 'status == "active"', filterParams: {brand: 'Random House'}})
  })

  it('resolves a function filter that returns a filter + params object', async () => {
    const result = await firstValueFrom(
      resolveIncomingReferencesFilter({
        documentId: 'doc1',
        documentPreviewStore: storeWith({_rev: 'r1'}),
        getClient,
        filter: () => ({filter: 'brand == $brand', filterParams: {brand: 'Penguin'}}),
      }),
    )

    expect(result).toEqual({filter: 'brand == $brand', filterParams: {brand: 'Penguin'}})
  })

  it('returns undefined filter when none is configured', async () => {
    const result = await firstValueFrom(
      resolveIncomingReferencesFilter({
        documentId: 'doc1',
        documentPreviewStore: storeWith({_rev: 'r1'}),
        getClient,
        filter: undefined,
      }),
    )

    expect(result.filter).toBeUndefined()
  })

  it('passes an unavailable document to the resolver', async () => {
    const filter = vi.fn(() => 'status == "active"')

    await firstValueFrom(
      resolveIncomingReferencesFilter({
        documentId: 'doc1',
        documentPreviewStore: storeWith(undefined),
        getClient,
        filter,
      }),
    )

    expect(filter).toHaveBeenCalledWith({document: undefined, getClient})
  })
})

describe('getIncomingReferences', () => {
  it('resolves an async filter once and emits it with the matching documents', async () => {
    const document = {_id: 'book1', _type: 'book', _rev: 'r1'}
    const filter = vi.fn(async () => ({
      filter: 'brand == $brand',
      filterParams: {brand: 'Penguin'},
    }))
    const observeDocumentIdSet = vi.fn<DocumentPreviewStore['unstable_observeDocumentIdSet']>(() =>
      of({status: 'connected', documentIds: ['book1']}),
    )
    const documentPreviewStore: DocumentPreviewStore = {
      ...storeWith(document),
      unstable_observeDocumentIdSet: observeDocumentIdSet,
    }

    const result = await firstValueFrom(
      getIncomingReferences({
        documentId: 'author1',
        documentPreviewStore,
        getClient,
        type: 'book',
        filter,
      }),
    )

    expect(filter).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      documents: [document],
      resolvedFilter: {filter: 'brand == $brand', filterParams: {brand: 'Penguin'}},
    })
    expect(observeDocumentIdSet).toHaveBeenCalledWith(
      expect.stringContaining('&& brand == $brand'),
      result.resolvedFilter.filterParams,
      {insert: 'append'},
    )
  })

  it('retains the search filter when loading the reference list fails', async () => {
    using consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Unable to load references')
    const documentPreviewStore: DocumentPreviewStore = {
      ...storeWith(undefined),
      unstable_observeDocumentIdSet: vi.fn(() => throwError(() => error)),
    }

    const result = await firstValueFrom(
      getIncomingReferences({
        documentId: 'author1',
        documentPreviewStore,
        getClient,
        type: 'book',
        filter: 'brand == $brand',
        filterParams: {brand: 'Penguin'},
      }),
    )

    expect(result).toEqual({
      documents: [],
      resolvedFilter: {filter: 'brand == $brand', filterParams: {brand: 'Penguin'}},
    })
    expect(consoleError).toHaveBeenCalledWith(
      new Error('Failed to load incoming references', {cause: error}),
    )
  })
})
