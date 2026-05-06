import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {documentConsistencyStatus} from './documentConsistencyStatus'
import {documentOperationEvents, emitDocumentOperation} from './documentOperationEvents'
import {documentSnapshot} from './documentSnapshot'
import {getDocumentVersions} from './getDocumentVersions'
import {type DocumentTarget} from './types'

vi.mock('./documentConsistencyStatus', () => ({documentConsistencyStatus: vi.fn()}))
vi.mock('./getDocumentVersions', () => ({getDocumentVersions: vi.fn()}))
vi.mock('./documentSnapshot', () => ({documentSnapshot: vi.fn()}))

const mockDocumentConsistencyStatus = documentConsistencyStatus as Mock<
  typeof documentConsistencyStatus
>
const mockGetDocumentVersions = getDocumentVersions as Mock<typeof getDocumentVersions>
const mockDocumentSnapshot = documentSnapshot as Mock<typeof documentSnapshot>

const target = {baseId: 'example-id', bundleId: 'drafts'} satisfies DocumentTarget
const typeName = 'movie'

function createContext() {
  const client = createMockSanityClient() as unknown as SanityClient

  return {
    client,
    historyStore: {} as never,
    schema: {} as never,
    serverActionsEnabled: of(true),
  }
}

function createDocument() {
  return {
    commit: vi.fn(),
    create: vi.fn((document) => ({create: document})),
    createIfNotExists: vi.fn((document) => ({createIfNotExists: document})),
    delete: vi.fn(() => ({delete: {id: 'drafts.example-id'}})),
    mutate: vi.fn(),
    patch: vi.fn((patches) => patches),
    snapshots$: of(null),
  }
}

function mockOperationArgs(document = createDocument()) {
  mockDocumentSnapshot.mockReturnValue(
    of({
      document,
      transactionsPendingEvents$: of({type: 'pending', phase: 'begin'}),
    } as never),
  )
  mockGetDocumentVersions.mockReturnValue(
    of({publishedId: 'example-id', draftId: 'drafts.example-id'}),
  )
  mockDocumentConsistencyStatus.mockReturnValue(of(true))
  return document
}

describe('documentOperationEvents', () => {
  beforeEach(() => {
    mockDocumentConsistencyStatus.mockReset()
    mockDocumentSnapshot.mockReset()
    mockGetDocumentVersions.mockReset()
  })

  it('executes patch operations for the resolved document id', async () => {
    const ctx = createContext()
    const document = mockOperationArgs()
    const result = firstValueFrom(
      documentOperationEvents(ctx, 'drafts.example-id', target, typeName),
    )

    emitDocumentOperation('patch', 'drafts.example-id', [[{set: {title: 'Alien'}}]])

    await expect(result).resolves.toMatchObject({
      type: 'success',
      args: {
        operationName: 'patch',
        documentId: 'drafts.example-id',
      },
    })
    expect(document.createIfNotExists).toHaveBeenCalledWith({
      _id: 'drafts.example-id',
      _type: typeName,
    })
    expect(document.mutate).toHaveBeenNthCalledWith(1, [
      {createIfNotExists: {_id: 'drafts.example-id', _type: typeName}},
    ])
    expect(document.commit).toHaveBeenCalled()
    expect(document.mutate).toHaveBeenNthCalledWith(2, [{set: {title: 'Alien'}}])
  })

  it('maps operation errors to document-scoped events', async () => {
    const ctx = createContext()
    mockOperationArgs()
    const result = firstValueFrom(documentOperationEvents(ctx, 'drafts.error-id', target, typeName))

    emitDocumentOperation('publish', 'drafts.error-id', [])

    await expect(result).resolves.toMatchObject({
      type: 'error',
      args: {
        operationName: 'publish',
        documentId: 'drafts.error-id',
      },
      error: new Error('cannot execute "publish" when snapshot is missing'),
    })
  })

  it('filters out operation events for other document ids', async () => {
    const ctx = createContext()
    mockOperationArgs()
    const results: unknown[] = []
    const subscription = documentOperationEvents(
      ctx,
      'drafts.filtered-id',
      target,
      typeName,
    ).subscribe((event) => results.push(event))

    emitDocumentOperation('patch', 'drafts.other-id', [[]])
    await Promise.resolve()

    expect(results).toEqual([])
    subscription.unsubscribe()
  })

  it('waits for consistency before delete operations', async () => {
    const ctx = createContext()
    const document = mockOperationArgs()
    const result = firstValueFrom(
      documentOperationEvents(ctx, 'drafts.delete-id', target, typeName),
    )

    emitDocumentOperation('delete', 'drafts.delete-id', [])

    await expect(result).resolves.toMatchObject({
      type: 'success',
      args: {
        operationName: 'delete',
        documentId: 'drafts.delete-id',
      },
    })
    expect(document.commit).toHaveBeenCalled()
    expect(mockDocumentConsistencyStatus).toHaveBeenCalledWith(
      'drafts.delete-id',
      ctx.client,
      undefined,
    )
  })
})
