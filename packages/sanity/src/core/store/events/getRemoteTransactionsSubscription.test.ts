import {Subject} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {type DocumentRemoteMutationEvent} from '../document/buffered-doc/types'
import {type WithVersion} from '../document/document-pair/checkoutPair'
import {remoteSnapshots} from '../document/document-pair/remoteSnapshots'
import {collectEmissions} from './__fixtures__/collect.fixture'
import {DOCUMENT_ID, DRAFT_ID, minutesAfterBase, VERSION_ID} from './__fixtures__/events.fixture'
import {createMockClient} from './__fixtures__/mockClient'
import {effectPair, remoteMutationEvent} from './__fixtures__/transactions.fixture'
import {
  classifyRemoteMutation,
  getRemoteTransactionsSubscription,
  type RemoteMutationVerdict,
} from './getRemoteTransactionsSubscription'

vi.mock('../document/document-pair/remoteSnapshots', () => ({
  remoteSnapshots: vi.fn(),
}))

const mockRemoteSnapshots = vi.mocked(remoteSnapshots)

describe('classifyRemoteMutation', () => {
  const createdEffects = effectPair({before: null, after: {_id: DRAFT_ID}})
  const deletedEffects = effectPair({before: {_id: DRAFT_ID}, after: null})
  const modifiedEffects = effectPair({
    before: {_id: DRAFT_ID, name: 'before'},
    after: {_id: DRAFT_ID, name: 'after'},
  })

  it.each<{
    name: string
    version: 'draft' | 'published' | 'version'
    documentVariantType: 'draft' | 'published' | 'version'
    isLiveEdit: boolean
    effects: ReturnType<typeof effectPair>
    expected: RemoteMutationVerdict
  }>([
    {
      name: 'mutation for a different variant is ignored',
      version: 'published',
      documentVariantType: 'draft',
      isLiveEdit: false,
      effects: modifiedEffects,
      expected: 'ignore',
    },
    {
      name: 'draft mutation while viewing published is ignored',
      version: 'draft',
      documentVariantType: 'published',
      isLiveEdit: false,
      effects: modifiedEffects,
      expected: 'ignore',
    },
    {
      name: 'published mutation (non-liveEdit) triggers a refetch',
      version: 'published',
      documentVariantType: 'published',
      isLiveEdit: false,
      effects: modifiedEffects,
      expected: 'refetch',
    },
    {
      name: 'published modification with liveEdit is appended',
      version: 'published',
      documentVariantType: 'published',
      isLiveEdit: true,
      effects: modifiedEffects,
      expected: 'append',
    },
    {
      name: 'created effect triggers refetch-and-clear',
      version: 'draft',
      documentVariantType: 'draft',
      isLiveEdit: false,
      effects: createdEffects,
      expected: 'refetch-and-clear',
    },
    {
      name: 'deleted effect triggers refetch-and-clear',
      version: 'draft',
      documentVariantType: 'draft',
      isLiveEdit: false,
      effects: deletedEffects,
      expected: 'refetch-and-clear',
    },
    {
      name: 'draft modification is appended',
      version: 'draft',
      documentVariantType: 'draft',
      isLiveEdit: false,
      effects: modifiedEffects,
      expected: 'append',
    },
    {
      name: 'version modification is appended',
      version: 'version',
      documentVariantType: 'version',
      isLiveEdit: false,
      effects: modifiedEffects,
      expected: 'append',
    },
  ])('$name', ({version, documentVariantType, isLiveEdit, effects, expected}) => {
    const mutation = remoteMutationEvent({version, effects})
    expect(classifyRemoteMutation(mutation, {documentVariantType, isLiveEdit})).toBe(expected)
  })
})

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
