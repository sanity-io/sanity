import {type SanityDocument, type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {type DocumentVersion} from '../document-pair/checkoutPair'
import {documentSnapshot} from './documentSnapshot'
import {memoizedDocumentCheckout} from './memoizedDocumentCheckout'

vi.mock('./memoizedDocumentCheckout', () => ({memoizedDocumentCheckout: vi.fn()}))

const mockMemoizedDocumentCheckout = memoizedDocumentCheckout as Mock<
  typeof memoizedDocumentCheckout
>

function getMockClient() {
  return createMockSanityClient() as unknown as SanityClient
}

function createDocument(): DocumentVersion {
  const snapshot: SanityDocument = {
    _id: 'example-id',
    _type: 'movie',
    _rev: '123',
    _createdAt: '2021-01-01',
    _updatedAt: '2021-01-01',
  }

  return {
    consistency$: of(true),
    remoteSnapshot$: of({type: 'snapshot' as const, document: snapshot, version: 'draft'}),
    events: of({type: 'snapshot' as const, document: snapshot, version: 'draft'}),
    patch: vi.fn((patches) => patches),
    create: vi.fn((document) => ({create: document})),
    createIfNotExists: vi.fn((document) => ({createIfNotExists: document})),
    createOrReplace: vi.fn((document) => ({createOrReplace: document})),
    delete: vi.fn(() => ({delete: {id: 'example-id'}})),
    mutate: vi.fn(),
    commit: vi.fn(),
  }
}

describe('documentSnapshot', () => {
  beforeEach(() => {
    mockMemoizedDocumentCheckout.mockReset()
  })

  it('memoizes snapshot streams per client and document id', () => {
    const client = getMockClient()
    mockMemoizedDocumentCheckout.mockReturnValue(
      of({
        transactionsPendingEvents$: of({type: 'pending' as const, phase: 'begin' as const}),
        document: createDocument(),
      }),
    )

    expect(documentSnapshot('example-id', {client} as any)).toBe(
      documentSnapshot('example-id', {client} as any),
    )
  })

  it('wraps one checked-out document with snapshot and mutation helpers', async () => {
    const client = getMockClient()
    const document = createDocument()
    const pending = {type: 'pending' as const, phase: 'begin' as const}

    mockMemoizedDocumentCheckout.mockReturnValue(
      of({transactionsPendingEvents$: of(pending), document}),
    )

    const snapshot = await firstValueFrom(
      documentSnapshot('example-id-2', {
        client,
        extraOptions: {tag: 'test'},
      } as any),
    )

    await expect(firstValueFrom(snapshot.document.snapshots$)).resolves.toMatchObject({
      _id: 'example-id',
      _type: 'movie',
    })
    await expect(firstValueFrom(snapshot.transactionsPendingEvents$)).resolves.toEqual(pending)
    expect(snapshot.document.patch([{set: {title: 'Alien'}}])).toEqual([{set: {title: 'Alien'}}])

    expect(mockMemoizedDocumentCheckout).toHaveBeenCalledWith(client, 'example-id-2', {tag: 'test'})
  })

  it('memoizes snapshots for clients without project or dataset config', async () => {
    const client = {config: () => ({})} as SanityClient
    mockMemoizedDocumentCheckout.mockReturnValue(
      of({
        transactionsPendingEvents$: of({type: 'pending' as const, phase: 'begin' as const}),
        document: createDocument(),
      }),
    )

    await expect(
      firstValueFrom(documentSnapshot('configless-id', {client} as any)),
    ).resolves.toMatchObject({
      document: expect.any(Object),
    })
  })
})
