import {Subject} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {type DocumentRemoteMutationEvent} from '../document/buffered-doc/types'
import {type WithVersion} from '../document/document-pair/checkoutPair'
import {remoteSnapshots} from '../document/document-pair/remoteSnapshots'
import {collectEmissions} from './__fixtures__/collect.fixture'
import {DOCUMENT_ID, DRAFT_ID, minutesAfterBase, VERSION_ID} from './__fixtures__/events.fixture'
import {createMockClient} from './__fixtures__/mockClient'
import {effectPair, remoteMutationEvent} from './__fixtures__/transactions.fixture'
import {getRemoteTransactionsSubscription} from './getRemoteTransactionsSubscription'

vi.mock('../document/document-pair/remoteSnapshots', () => ({
  remoteSnapshots: vi.fn(),
}))

const mockRemoteSnapshots = vi.mocked(remoteSnapshots)

describe('getRemoteTransactionsSubscription', () => {
  let snapshots$: Subject<WithVersion<DocumentRemoteMutationEvent>>
  let onRefetch: Mock<() => void>

  beforeEach(() => {
    snapshots$ = new Subject()
    mockRemoteSnapshots.mockReset()
    mockRemoteSnapshots.mockReturnValue(snapshots$ as never)
    onRefetch = vi.fn<() => void>()
  })

  function setup(documentId: string, isLiveEdit = false) {
    const {client} = createMockClient()
    const result = getRemoteTransactionsSubscription({
      client,
      documentId,
      documentType: 'author',
      isLiveEdit,
      onRefetch,
    })
    const subscription = result.subscribe()
    return {...result, subscription}
  }

  it('appends modified mutations and emits synthesized edit events', () => {
    const {remoteTransactions$, remoteEdits$, subscription} = setup(DRAFT_ID)
    const {values: edits, subscription: editsSubscription} = collectEmissions(remoteEdits$)

    snapshots$.next(remoteMutationEvent({transactionId: 'tx-remote-1'}))
    expect(remoteTransactions$.value.map((tx) => tx.id)).toEqual(['tx-remote-1'])
    expect(edits.at(-1)).toEqual([
      expect.objectContaining({type: 'editDocumentVersion', id: 'tx-remote-1'}),
    ])
    expect(onRefetch).not.toHaveBeenCalled()

    // Known quirk: transactions accumulate without bound during an editing session.
    snapshots$.next(
      remoteMutationEvent({
        transactionId: 'tx-remote-2',
        timestamp: new Date(minutesAfterBase(1)),
      }),
    )
    expect(remoteTransactions$.value.map((tx) => tx.id)).toEqual(['tx-remote-1', 'tx-remote-2'])

    editsSubscription.unsubscribe()
    subscription.unsubscribe()
  })

  it('ignores mutations for a different variant than the one being viewed', () => {
    const {remoteTransactions$, subscription} = setup(DRAFT_ID)

    snapshots$.next(remoteMutationEvent({version: 'published'}))
    expect(remoteTransactions$.value).toEqual([])
    expect(onRefetch).not.toHaveBeenCalled()

    subscription.unsubscribe()
  })

  it('refetches on published-document mutations when not live edit', () => {
    const {remoteTransactions$, subscription} = setup(DOCUMENT_ID)

    snapshots$.next(remoteMutationEvent({version: 'published'}))
    expect(onRefetch).toHaveBeenCalledTimes(1)
    expect(remoteTransactions$.value).toEqual([])

    subscription.unsubscribe()
  })

  it('live edit: published-document modifications accumulate instead of refetching', () => {
    const {remoteTransactions$, subscription} = setup(DOCUMENT_ID, true)

    snapshots$.next(remoteMutationEvent({version: 'published', transactionId: 'tx-live'}))
    expect(onRefetch).not.toHaveBeenCalled()
    expect(remoteTransactions$.value.map((tx) => tx.id)).toEqual(['tx-live'])

    subscription.unsubscribe()
  })

  it('refetches and clears accumulated transactions on created/deleted effects', () => {
    const {remoteTransactions$, subscription} = setup(DRAFT_ID)

    snapshots$.next(remoteMutationEvent({transactionId: 'tx-edit'}))
    expect(remoteTransactions$.value).toHaveLength(1)

    snapshots$.next(
      remoteMutationEvent({
        transactionId: 'tx-delete',
        effects: effectPair({before: {_id: DRAFT_ID}, after: null}),
      }),
    )
    expect(onRefetch).toHaveBeenCalledTimes(1)
    expect(remoteTransactions$.value).toEqual([])

    subscription.unsubscribe()
  })

  it('listens to the whole document pair, including the version id when applicable', () => {
    setup(VERSION_ID).subscription.unsubscribe()

    expect(mockRemoteSnapshots).toHaveBeenCalledWith(
      expect.anything(),
      {
        draftId: DRAFT_ID,
        publishedId: DOCUMENT_ID,
        versionId: VERSION_ID,
      },
      'author',
    )
  })
})
