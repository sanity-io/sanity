import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {documentSnapshot} from './documentSnapshot'
import {memoizedDocumentCheckout} from './memoizedDocumentCheckout'

vi.mock('./memoizedDocumentCheckout', () => ({memoizedDocumentCheckout: vi.fn()}))

const mockMemoizedDocumentCheckout = memoizedDocumentCheckout as Mock<
  typeof memoizedDocumentCheckout
>

function getMockClient() {
  return createMockSanityClient() as unknown as SanityClient
}

function createDocument() {
  const snapshot = {_id: 'example-id', _type: 'movie'}

  return {
    events: of({type: 'snapshot' as const, document: snapshot}),
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
        transactionsPendingEvents$: of({type: 'pending', phase: 'begin'}),
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
        serverActionsEnabled: of(true),
        extraOptions: {tag: 'test'},
      } as any),
    )

    await expect(firstValueFrom(snapshot.document.snapshots$)).resolves.toEqual({
      _id: 'example-id',
      _type: 'movie',
    })
    await expect(firstValueFrom(snapshot.transactionsPendingEvents$)).resolves.toEqual(pending)
    expect(snapshot.document.patch([{set: {title: 'Alien'}}])).toEqual([{set: {title: 'Alien'}}])

    expect(mockMemoizedDocumentCheckout).toHaveBeenCalledWith(
      client,
      'example-id-2',
      expect.anything(),
      {tag: 'test'},
    )
  })

  it('memoizes snapshots for clients without project or dataset config', async () => {
    const client = {config: () => ({})} as SanityClient
    mockMemoizedDocumentCheckout.mockReturnValue(
      of({
        transactionsPendingEvents$: of({type: 'pending', phase: 'begin'}),
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
