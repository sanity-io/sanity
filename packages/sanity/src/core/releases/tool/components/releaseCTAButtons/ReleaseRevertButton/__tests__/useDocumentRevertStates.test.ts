import {type SanityClient} from '@sanity/client'
import {
  type MendozaEffectPair,
  type TransactionLogEventWithEffects,
  type TransactionLogEventWithMutations,
} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {delay, of, throwError} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {useClient} from '../../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../../store/translog/getTransactionsLogs'
import {passthroughErrorHandler} from '../../../../../../studio/requestErrors/createRequestErrorChannel'
import {type StudioErrorHandler} from '../../../../../../studio/requestErrors/types'
import {useStudioErrorHandler} from '../../../../../../studio/requestErrors/useStudioErrorHandler'
import {type DocumentInRelease} from '../../../../detail/types'
import {type DocumentRevertStates, useDocumentRevertStates} from '../useDocumentRevertStates'

vi.mock('../../../../../../studio/requestErrors/useStudioErrorHandler', () => ({
  useStudioErrorHandler: vi.fn(),
}))

vi.mock('../../../../../../hooks/useClient', () => ({
  useClient: vi.fn(),
}))

vi.mock('../../../../../../store/translog/getTransactionsLogs', () => ({
  getTransactionsLogs: vi.fn(),
}))

type Transaction = TransactionLogEventWithEffects & TransactionLogEventWithMutations

const PUBLISH_REV = 'publishRev'

// Mendoza shapes: `[0, null]` maps a document to nothing; anything else is an ordinary edit
const DELETE_PATCH = [0, null]
const EDIT_PATCH = [11, 3, 'edit']
const edited: MendozaEffectPair = {apply: EDIT_PATCH, revert: EDIT_PATCH}
const created: MendozaEffectPair = {apply: EDIT_PATCH, revert: DELETE_PATCH}
const deleted: MendozaEffectPair = {apply: DELETE_PATCH, revert: EDIT_PATCH}

function transaction(
  id: string,
  documentIDs: string[],
  effects: Record<string, MendozaEffectPair> = Object.fromEntries(
    documentIDs.map((documentId) => [documentId, edited]),
  ),
): Transaction {
  return {id, documentIDs, effects, timestamp: new Date().toISOString()} as unknown as Transaction
}

/** The release publish transaction, touching both documents; `createdIds` did not exist before */
function publishTransaction(createdIds: string[] = []): Transaction {
  return transaction(PUBLISH_REV, ['doc1', 'doc2'], {
    doc1: createdIds.includes('doc1') ? created : edited,
    doc2: createdIds.includes('doc2') ? created : edited,
  })
}

const bulkParams = {
  toTransaction: PUBLISH_REV,
  reverse: true,
  limit: 1000,
  effectFormat: 'mendoza',
}
const perDocumentParams = {
  toTransaction: PUBLISH_REV,
  reverse: true,
  limit: 2,
  effectFormat: 'mendoza',
}
const publishTransactionParams = {
  fromTransaction: PUBLISH_REV,
  toTransaction: PUBLISH_REV,
  limit: 1,
  effectFormat: 'mendoza',
}

function revisionDocument(documentId: string, revision: string) {
  return {_id: documentId, _rev: revision, title: `${documentId} @ ${revision}`}
}

const doc2Tombstone = {_id: 'doc2', _rev: PUBLISH_REV, _system: {delete: true}}

async function resolveStates(documents: DocumentInRelease[]): Promise<DocumentRevertStates> {
  const {result} = renderHook(() => useDocumentRevertStates(documents))
  await waitFor(() => expect(result.current).not.toBeNull())
  return result.current!
}

describe('useDocumentRevertStates', () => {
  // Documents of a published release share the publish transaction as `_rev`
  const mockDocuments = [
    {document: {_id: 'versions.r1.doc1', _rev: PUBLISH_REV, publishedDocumentExists: true}},
    {document: {_id: 'versions.r1.doc2', _rev: PUBLISH_REV, publishedDocumentExists: true}},
  ] as DocumentInRelease[]

  const mockClient = {
    getUrl: vi.fn(),
    config: vi.fn().mockReturnValue({dataset: 'test-dataset'}),
    observable: {
      request: vi.fn(),
    },
  } as unknown as SanityClient & {
    observable: {
      request: Mock<SanityClient['observable']['request']>
    }
  }

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const mockUseClient = useClient as Mock<typeof useClient>
  const mockGetTransactionsLogs = getTransactionsLogs as Mock<typeof getTransactionsLogs>
  const mockUseStudioErrorHandler = useStudioErrorHandler as Mock<typeof useStudioErrorHandler>

  /**
   * Routes the three translog request kinds: bulk requests (array of ids), per-document publish
   * transaction lookups (single id, `fromTransaction` set) and per-document history lookups
   */
  function mockTranslog(handlers: {
    bulk?: (documentIds: string[]) => Promise<Transaction[]>
    publish?: (documentId: string) => Promise<Transaction[]>
    perDocument?: (documentId: string) => Promise<Transaction[]>
  }) {
    const none = () => Promise.resolve([])
    mockGetTransactionsLogs.mockImplementation((_client, documentIds, params) => {
      if (Array.isArray(documentIds)) return (handlers.bulk ?? none)(documentIds)
      return params.fromTransaction
        ? (handlers.publish ?? none)(documentIds)
        : (handlers.perDocument ?? none)(documentIds)
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseClient.mockReturnValue(mockClient)
    // Outside a WorkspacesProvider the real hook returns this passthrough: no dialog, errors reject
    mockUseStudioErrorHandler.mockReturnValue(passthroughErrorHandler)

    mockClient.observable.request.mockImplementation(({url}) => {
      const [, documentId, revision] = url!.match(/documents\/([^?]+)\?revision=(.+)$/) ?? []
      return of({documents: [revisionDocument(documentId, revision)]})
    })
  })

  it('is null while resolving', () => {
    mockTranslog({bulk: () => new Promise(() => {})})
    const {result} = renderHook(() => useDocumentRevertStates(mockDocuments))
    expect(result.current).toBeNull()
  })

  it('resolves every document from a single bulk translog request, skipping the publish transaction', async () => {
    mockTranslog({
      bulk: () =>
        Promise.resolve([
          publishTransaction(),
          transaction('t1_doc1', ['doc1']),
          transaction('t0_doc1', ['doc1']),
          transaction('t1_doc2', ['doc2']),
        ]),
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments).toEqual([
      revisionDocument('doc1', 't1_doc1'),
      revisionDocument('doc2', 't1_doc2'),
    ])
    expect(states).toMatchObject({revertCount: 2, unpublishCount: 0, unresolvedDocumentIds: []})

    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(1)
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, ['doc1', 'doc2'], bulkParams)
    expect(mockClient.observable.request).toHaveBeenCalledWith({
      url: '/data/history/test-dataset/documents/doc1?revision=t1_doc1',
    })
    expect(mockClient.observable.request).toHaveBeenCalledWith({
      url: '/data/history/test-dataset/documents/doc2?revision=t1_doc2',
    })
  })

  it('looks up documents missing from the bulk response individually instead of unpublishing them', async () => {
    // doc2 fell outside the bulk window (e.g. doc1 has more recent history than the limit covers)
    mockTranslog({
      bulk: () => Promise.resolve([transaction('t1_doc1', ['doc1'])]),
      perDocument: (documentId) =>
        Promise.resolve([
          transaction(PUBLISH_REV, [documentId]),
          transaction(`old_${documentId}`, [documentId]),
        ]),
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments).toEqual([
      revisionDocument('doc1', 't1_doc1'),
      revisionDocument('doc2', 'old_doc2'),
    ])
    expect(states).toMatchObject({revertCount: 2, unpublishCount: 0, unresolvedDocumentIds: []})
    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(2)
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, 'doc2', perDocumentParams)
  })

  it('unpublishes a document only when the publish transaction proves the release created it', async () => {
    mockTranslog({
      bulk: () => Promise.resolve([publishTransaction(['doc2']), transaction('t1_doc1', ['doc1'])]),
      // doc2 has no history before the publish
      perDocument: () => Promise.resolve([]),
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments).toEqual([revisionDocument('doc1', 't1_doc1'), doc2Tombstone])
    expect(states).toMatchObject({revertCount: 1, unpublishCount: 1, unresolvedDocumentIds: []})
    // the publish transaction came with the bulk response, so no extra request for it
    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(2)
  })

  it('fetches the publish transaction for a document when the bulk response does not include it', async () => {
    mockTranslog({
      bulk: () => Promise.resolve([transaction('t1_doc1', ['doc1'])]),
      perDocument: () => Promise.resolve([]),
      publish: () => Promise.resolve([publishTransaction(['doc2'])]),
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments).toEqual([revisionDocument('doc1', 't1_doc1'), doc2Tombstone])
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(
      mockClient,
      'doc2',
      publishTransactionParams,
    )
  })

  it('splits the bulk request into chunks that keep the joined ids within the URL budget', async () => {
    // Long ids (Sanity allows up to 128 characters) force several chunks
    const manyDocuments = Array.from({length: 250}, (_, i) => ({
      document: {
        _id: `versions.r1.${String(i).padStart(3, '0')}-${'x'.repeat(115)}`,
        _rev: PUBLISH_REV,
        publishedDocumentExists: true,
      },
    })) as DocumentInRelease[]
    const publishedIds = manyDocuments.map((doc) => doc.document._id.replace('versions.r1.', ''))
    mockTranslog({
      bulk: (documentIds) =>
        Promise.resolve(
          documentIds.map((documentId) => transaction(`t1_${documentId}`, [documentId])),
        ),
    })

    const states = await resolveStates(manyDocuments)

    expect(states.revertCount).toBe(250)
    expect(states.unresolvedDocumentIds).toEqual([])
    const bulkChunks = mockGetTransactionsLogs.mock.calls
      .filter(([, ids]) => Array.isArray(ids))
      .map(([, ids]) => ids as string[])
    expect(bulkChunks.length).toBeGreaterThan(1)
    for (const ids of bulkChunks) {
      expect(ids.join(',').length).toBeLessThanOrEqual(6000)
    }
    expect(bulkChunks.flat()).toEqual(publishedIds)
  })

  it('only trusts a bulk response for the ids it was requested for', async () => {
    // A transaction touching documents in two chunks comes back in both responses. If the chunk
    // that does not own a document completes first, that shared transaction must not shadow the
    // newer transaction in the document's own chunk.
    const longId = (i: number) => `${String(i).padStart(3, '0')}-${'x'.repeat(115)}`
    const documents = Array.from({length: 60}, (_, i) => ({
      document: {_id: `versions.r1.${longId(i)}`, _rev: PUBLISH_REV, publishedDocumentExists: true},
    })) as DocumentInRelease[]
    const docA = longId(0) // first chunk
    const docB = longId(59) // second chunk
    const shared = transaction('shared_older', [docA, docB])
    const newerForB = transaction('newer_for_b', [docB])
    const others = (documentIds: string[], except: string) =>
      documentIds.filter((id) => id !== except).map((id) => transaction(`t_${id}`, [id]))
    mockTranslog({
      bulk: (documentIds) =>
        documentIds.includes(docA)
          ? Promise.resolve([shared, ...others(documentIds, docA)])
          : new Promise((resolve) =>
              setTimeout(() => resolve([newerForB, shared, ...others(documentIds, docB)]), 20),
            ),
    })

    const states = await resolveStates(documents)

    expect(mockGetTransactionsLogs.mock.calls.filter(([, ids]) => Array.isArray(ids))).toHaveLength(
      2,
    )
    expect(states.unresolvedDocumentIds).toEqual([])
    expect(mockClient.observable.request).toHaveBeenCalledWith({
      url: `/data/history/test-dataset/documents/${docA}?revision=shared_older`,
    })
    expect(mockClient.observable.request).toHaveBeenCalledWith({
      url: `/data/history/test-dataset/documents/${docB}?revision=newer_for_b`,
    })
  })

  it('marks a document unresolved when it has no pre-release history and the release did not create it', async () => {
    // Retention pruned doc2's older history: the publish transaction edited an existing document
    mockTranslog({
      bulk: () => Promise.resolve([publishTransaction(), transaction('t1_doc1', ['doc1'])]),
      perDocument: () => Promise.resolve([]),
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments).toEqual([revisionDocument('doc1', 't1_doc1')])
    expect(states).toMatchObject({
      revertCount: 1,
      unpublishCount: 0,
      unresolvedDocumentIds: ['doc2'],
    })
    expect(states.states[1]).toMatchObject({
      documentId: 'doc2',
      type: 'unresolved',
      reason: 'history-unavailable',
    })
  })

  it('unpublishes a document whose last pre-release transaction deleted it, without fetching a snapshot', async () => {
    mockTranslog({
      bulk: () =>
        Promise.resolve([
          transaction('t1_doc1', ['doc1']),
          transaction('delete_doc2', ['doc2'], {doc2: deleted}),
        ]),
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments).toEqual([revisionDocument('doc1', 't1_doc1'), doc2Tombstone])
    expect(states).toMatchObject({revertCount: 1, unpublishCount: 1, unresolvedDocumentIds: []})
    expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
    expect(mockClient.observable.request).not.toHaveBeenCalledWith(
      expect.objectContaining({url: expect.stringContaining('doc2')}),
    )
  })

  it('marks a document unresolved when its pre-release snapshot is no longer in history', async () => {
    mockTranslog({
      bulk: () =>
        Promise.resolve([transaction('t1_doc1', ['doc1']), transaction('t1_doc2', ['doc2'])]),
    })
    mockClient.observable.request.mockImplementation(({url}) => {
      if (url!.includes('doc2')) return of({documents: []})
      return of({documents: [revisionDocument('doc1', 't1_doc1')]})
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments).toEqual([revisionDocument('doc1', 't1_doc1')])
    expect(states.unresolvedDocumentIds).toEqual(['doc2'])
    expect(states.states[1]).toMatchObject({
      type: 'unresolved',
      reason: 'history-unavailable',
      error: expect.objectContaining({message: expect.stringContaining('no longer available')}),
    })
  })

  it('marks a document unresolved when its individual translog lookup fails', async () => {
    mockTranslog({
      bulk: () => Promise.resolve([transaction('t1_doc1', ['doc1'])]),
      perDocument: () => Promise.reject(new Error('403 Forbidden')),
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments).toEqual([revisionDocument('doc1', 't1_doc1')])
    expect(states).toMatchObject({
      revertCount: 1,
      unpublishCount: 0,
      unresolvedDocumentIds: ['doc2'],
    })
    expect(states.states[1]).toMatchObject({
      documentId: 'doc2',
      type: 'unresolved',
      reason: 'request-failed',
    })
  })

  it('marks a document unresolved when fetching its previous revision fails', async () => {
    mockTranslog({
      bulk: () =>
        Promise.resolve([transaction('t1_doc1', ['doc1']), transaction('t1_doc2', ['doc2'])]),
    })
    mockClient.observable.request.mockImplementation(({url}) => {
      if (url!.includes('doc2')) return throwError(() => new Error('Failed to fetch'))
      return of({documents: [revisionDocument('doc1', 't1_doc1')]})
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments).toEqual([revisionDocument('doc1', 't1_doc1')])
    expect(states.unresolvedDocumentIds).toEqual(['doc2'])
    expect(states.states[1]).toMatchObject({type: 'unresolved', reason: 'request-failed'})
  })

  it('marks every document unresolved when the bulk request fails, without per-document retries', async () => {
    mockTranslog({
      bulk: () => Promise.reject(new Error('403 Forbidden')),
      perDocument: (documentId) => Promise.resolve([transaction(`t1_${documentId}`, [documentId])]),
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments).toEqual([])
    expect(states.unresolvedDocumentIds).toEqual(['doc1', 'doc2'])
    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(1)
    expect(mockClient.observable.request).not.toHaveBeenCalled()
  })

  it('runs every history request through the studio error handler as a retryable read', async () => {
    const attempt = vi.fn(passthroughErrorHandler.attempt)
    mockUseStudioErrorHandler.mockReturnValue({
      ...passthroughErrorHandler,
      attempt: attempt as StudioErrorHandler['attempt'],
    })
    mockTranslog({
      bulk: () => Promise.resolve([transaction('t1_doc1', ['doc1'])]),
      perDocument: (documentId) => Promise.resolve([transaction(`t1_${documentId}`, [documentId])]),
    })

    const states = await resolveStates(mockDocuments)

    expect(states.unresolvedDocumentIds).toEqual([])
    // bulk translog + doc2 translog + two revision fetches
    expect(attempt).toHaveBeenCalledTimes(4)
    for (const call of attempt.mock.calls) {
      expect(call[1]).toEqual({retryable: true})
    }
  })

  it('stays in the resolving state while the studio error handler holds a claimed request', async () => {
    // A claimed error (network, 5xx, 429) parks the request behind the studio dialog: the
    // returned promise stays pending until "Try again" succeeds, so nothing resolves here.
    const parked: StudioErrorHandler = {
      ...passthroughErrorHandler,
      attempt: () => new Promise(() => {}),
    }
    mockUseStudioErrorHandler.mockReturnValue(parked)
    mockTranslog({bulk: () => Promise.reject(new Error('network error'))})

    const {result} = renderHook(() => useDocumentRevertStates(mockDocuments))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(result.current).toBeNull()
  })

  it('keeps release order even when documents resolve out of order', async () => {
    mockTranslog({
      bulk: () =>
        Promise.resolve([transaction('t1_doc1', ['doc1']), transaction('t1_doc2', ['doc2'])]),
    })
    mockClient.observable.request.mockImplementation(({url}) => {
      if (url!.includes('doc1')) {
        return of({documents: [revisionDocument('doc1', 't1_doc1')]}).pipe(delay(20))
      }
      return of({documents: [revisionDocument('doc2', 't1_doc2')]})
    })

    const states = await resolveStates(mockDocuments)

    expect(states.revertDocuments.map((doc) => doc._id)).toEqual(['doc1', 'doc2'])
  })

  it('resolves to an empty state without requests when the release has no documents', async () => {
    const states = await resolveStates([])

    expect(states).toEqual({
      states: [],
      revertDocuments: [],
      revertCount: 0,
      unpublishCount: 0,
      unresolvedDocumentIds: [],
    })
    expect(mockGetTransactionsLogs).not.toHaveBeenCalled()
    expect(mockClient.observable.request).not.toHaveBeenCalled()
  })
})
