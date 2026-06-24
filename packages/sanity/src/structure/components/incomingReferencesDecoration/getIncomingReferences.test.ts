import {firstValueFrom, of} from 'rxjs'
import {type DocumentPreviewStore, type SanityClient} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {resolveIncomingReferencesFilter} from './getIncomingReferences'

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
})
