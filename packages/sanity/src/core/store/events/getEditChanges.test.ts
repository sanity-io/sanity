import {type SanityDocument} from '@sanity/types'
import {BehaviorSubject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {BASE_TIME, DRAFT_ID, minutesAfterBase} from './__fixtures__/events.fixture'
import {createMockClient} from './__fixtures__/mockClient'
import {editTransaction, type TranslogEntry} from './__fixtures__/transactions.fixture'
import {clearDocumentRevisionCache} from './getDocumentAtRevision'
import {createEditChanges, getTransactionChains, type TransactionChain} from './getEditChanges'

/** The mendoza patch that sets fields of a document: `[17, value, key]` for each. */
function setFields(fields: Record<string, unknown>): unknown[] {
  return Object.entries(fields).flatMap(([key, value]) => [17, value, key])
}

/**
 * An edit that sets fields of the document with the mendoza patches the translog records, so each
 * change is attributed to the transaction that made it.
 */
function fieldsTransaction({
  id,
  author,
  timestamp,
  apply,
  revert,
}: {
  id: string
  author: string
  timestamp: string
  apply: Record<string, unknown>
  revert: Record<string, unknown>
}): TranslogEntry {
  return {
    ...editTransaction({id, author, timestamp}),
    effects: {[DRAFT_ID]: {apply: setFields(apply), revert: setFields(revert)}},
  }
}

const tx1 = fieldsTransaction({
  id: 'tx-1',
  author: 'ada',
  timestamp: minutesAfterBase(1),
  apply: {name: 'Ada Lovelace', _updatedAt: minutesAfterBase(1)},
  revert: {name: 'Ada', _updatedAt: BASE_TIME},
})
const tx2 = fieldsTransaction({
  id: 'tx-2',
  author: 'grace',
  timestamp: minutesAfterBase(2),
  apply: {role: 'designer', _updatedAt: minutesAfterBase(2)},
  revert: {role: 'developer', _updatedAt: minutesAfterBase(1)},
})
const tx3 = fieldsTransaction({
  id: 'tx-3',
  author: 'grace',
  timestamp: minutesAfterBase(3),
  apply: {_updatedAt: minutesAfterBase(3)},
  revert: {_updatedAt: minutesAfterBase(2)},
})
const tx4 = fieldsTransaction({
  id: 'tx-4',
  author: 'ada',
  timestamp: minutesAfterBase(4),
  apply: {name: 'Ada King', _updatedAt: minutesAfterBase(4)},
  revert: {name: 'Ada Lovelace', _updatedAt: minutesAfterBase(3)},
})

/** The document after `rev`, as the listener or the history API has it. */
function documentAt(rev: string, fields: Record<string, unknown>): SanityDocument {
  return {_id: DRAFT_ID, _type: 'author', _rev: rev, _createdAt: BASE_TIME, ...fields} as never
}
const AT_TX_1 = documentAt('tx-1', {
  _updatedAt: minutesAfterBase(1),
  name: 'Ada Lovelace',
  role: 'developer',
})
const AT_TX_2 = documentAt('tx-2', {
  _updatedAt: minutesAfterBase(2),
  name: 'Ada Lovelace',
  role: 'designer',
})
const AT_TX_3 = {...AT_TX_2, _rev: 'tx-3', _updatedAt: minutesAfterBase(3)}
const AT_TX_4 = {...AT_TX_3, _rev: 'tx-4', _updatedAt: minutesAfterBase(4), name: 'Ada King'}

const ADA_AT_TX_1 = {author: 'ada', timestamp: minutesAfterBase(1)}
const GRACE_AT_TX_2 = {author: 'grace', timestamp: minutesAfterBase(2)}

const live = (...transactions: TranslogEntry[]): TransactionChain => ({transactions, live: true})
const closed = (...transactions: TranslogEntry[]): TransactionChain => ({
  transactions,
  live: false,
})

function setup({
  chains,
  liveDocument,
  documents = {},
}: {
  chains: TransactionChain[]
  liveDocument: SanityDocument | null | undefined
  documents?: Record<string, SanityDocument>
}) {
  const {client, requests} = createMockClient({
    respond: (request) => {
      const revision = new URL(request.url, 'https://example.test').searchParams.get('revision')
      const document = revision && documents[revision]
      return {documents: document ? [document] : []}
    },
  })
  const chains$ = new BehaviorSubject(chains)
  const liveDocument$ = new BehaviorSubject(liveDocument)
  const getEditChanges = createEditChanges({client, documentId: DRAFT_ID, chains$, liveDocument$})
  /** The changes of a range, once they are known. */
  const changesOf = (fromRevisionId: string, toRevisionId: string) => {
    const {values, subscription} = collectEmissions(getEditChanges({fromRevisionId, toRevisionId}))
    return {values, subscription, last: () => values.at(-1)}
  }
  return {changesOf, requests, chains$, liveDocument$}
}

describe('createEditChanges', () => {
  beforeEach(() => {
    clearDocumentRevisionCache()
  })

  it('rebuilds a group from the live document, attributing each change, without requests', () => {
    const {changesOf, requests} = setup({chains: [live(tx1, tx2, tx3)], liveDocument: AT_TX_3})

    const {values, subscription} = changesOf('tx-1', 'tx-2')

    expect(values[0]).toEqual({loading: true, diff: null, error: null})
    const {diff, error, loading} = values.at(-1)!
    expect({loading, error}).toEqual({loading: false, error: null})
    expect(diff?.fields.name).toMatchObject({
      action: 'changed',
      fromValue: 'Ada',
      toValue: 'Ada Lovelace',
      annotation: ADA_AT_TX_1,
    })
    expect(diff?.fields.role).toMatchObject({
      action: 'changed',
      fromValue: 'developer',
      toValue: 'designer',
      annotation: GRACE_AT_TX_2,
    })
    // The system fields the transactions touched aren't changes of the document.
    expect(Object.keys(diff?.fields ?? {}).toSorted()).toEqual(['name', 'role'])
    // The changes of a range don't change.
    expect(subscription.closed).toBe(true)
    expect(requests).toHaveLength(0)
  })

  it('rebuilds a single transaction, and the ones sharing transactions with it', () => {
    const {changesOf, requests} = setup({chains: [live(tx1, tx2, tx3)], liveDocument: AT_TX_3})

    const second = changesOf('tx-2', 'tx-2').last()
    expect(second?.diff?.fields.name).toMatchObject({action: 'unchanged'})
    expect(second?.diff?.fields.role).toMatchObject({
      fromValue: 'developer',
      toValue: 'designer',
      annotation: GRACE_AT_TX_2,
    })
    const first = changesOf('tx-1', 'tx-1').last()
    expect(first?.diff?.fields.name).toMatchObject({fromValue: 'Ada', toValue: 'Ada Lovelace'})
    expect(first?.diff?.fields.role).toMatchObject({action: 'unchanged'})
    expect(requests).toHaveLength(0)
  })

  it('has no changes for a transaction that only touched system fields', () => {
    const {changesOf} = setup({chains: [live(tx1, tx2, tx3)], liveDocument: AT_TX_3})

    expect(changesOf('tx-3', 'tx-3').last()).toMatchObject({
      error: null,
      diff: {action: 'unchanged', isChanged: false},
    })
  })

  it('rebuilds the changes of a transaction received live from its document, without requests', () => {
    const {changesOf, requests, chains$, liveDocument$} = setup({
      chains: [live(tx1, tx2, tx3)],
      liveDocument: AT_TX_3,
    })
    changesOf('tx-1', 'tx-3')

    // The transaction arrives first, then the document it resulted in.
    chains$.next([live(tx1, tx2, tx3, tx4)])
    liveDocument$.next(AT_TX_4)
    const {diff} = changesOf('tx-1', 'tx-4').last()!

    expect(diff?.fields.name).toMatchObject({
      fromValue: 'Ada',
      toValue: 'Ada King',
      annotation: {author: 'ada', timestamp: minutesAfterBase(4)},
    })
    expect(diff?.fields.role).toMatchObject({fromValue: 'developer', toValue: 'designer'})
    expect(requests).toHaveLength(0)
  })

  it('applies the transactions newer than the live document', () => {
    const {changesOf, requests} = setup({chains: [live(tx1, tx2, tx3)], liveDocument: AT_TX_1})

    expect(changesOf('tx-2', 'tx-3').last()?.diff?.fields.role).toMatchObject({
      fromValue: 'developer',
      toValue: 'designer',
      annotation: GRACE_AT_TX_2,
    })
    expect(changesOf('tx-1', 'tx-1').last()?.diff?.fields.name).toMatchObject({
      fromValue: 'Ada',
      toValue: 'Ada Lovelace',
    })
    expect(requests).toHaveLength(0)
  })

  it('waits for the live document, and for the transactions of a range, instead of fetching', () => {
    const {changesOf, requests, chains$, liveDocument$} = setup({
      chains: [live()],
      liveDocument: undefined,
    })
    const {values} = changesOf('tx-1', 'tx-2')

    chains$.next([live(tx1, tx2, tx3)])
    expect(values).toEqual([{loading: true, diff: null, error: null}])
    liveDocument$.next(AT_TX_3)
    expect(values.at(-1)?.diff?.fields.role).toMatchObject({toValue: 'designer'})
    expect(requests).toHaveLength(0)
  })

  it('fetches the document at the newest transaction of another chain once, for all its ranges', async () => {
    const {changesOf, requests} = setup({
      chains: [live(tx3), closed(tx1, tx2)],
      liveDocument: AT_TX_3,
      documents: {'tx-2': AT_TX_2},
    })

    const group = changesOf('tx-1', 'tx-2')
    await vi.waitFor(() => expect(group.last()?.loading).toBe(false))
    const first = changesOf('tx-1', 'tx-1')
    const second = changesOf('tx-2', 'tx-2')

    expect(group.last()?.diff?.fields.name).toMatchObject({
      fromValue: 'Ada',
      toValue: 'Ada Lovelace',
    })
    expect(first.last()?.diff?.fields.role).toMatchObject({action: 'unchanged'})
    expect(second.last()?.diff?.fields.role).toMatchObject({toValue: 'designer'})
    expect(requests.map(({url}) => url)).toEqual([expect.stringContaining('revision=tx-2')])
  })

  it('fetches the newest document of the live chain when the live document is not one of its results', async () => {
    const {changesOf, requests} = setup({
      chains: [live(tx1, tx2, tx3)],
      liveDocument: {...AT_TX_3, _rev: 'tx-unknown'},
      documents: {'tx-3': AT_TX_3},
    })

    const changes = changesOf('tx-1', 'tx-2')
    await vi.waitFor(() => expect(changes.last()?.loading).toBe(false))

    expect(changes.last()?.diff?.fields.role).toMatchObject({toValue: 'designer'})
    expect(requests.map(({url}) => url)).toEqual([expect.stringContaining('revision=tx-3')])
  })

  it('emits an error when the document of a chain is missing', async () => {
    const {changesOf} = setup({chains: [live(tx3), closed(tx1, tx2)], liveDocument: AT_TX_3})

    const changes = changesOf('tx-1', 'tx-2')
    await vi.waitFor(() => expect(changes.last()?.loading).toBe(false))

    expect(changes.last()).toEqual({
      loading: false,
      diff: null,
      error: new Error('Missing document for revision tx-2'),
    })
  })
})

describe('getTransactionChains', () => {
  it('continues the newest fetch with the transactions received since, and keeps the others apart', () => {
    const older = editTransaction({id: 'tx-old', timestamp: BASE_TIME})
    const expanded = editTransaction({id: 'tx-expanded', timestamp: BASE_TIME})

    expect(
      getTransactionChains({
        fetched: [[older], [tx1, tx2]],
        // The listener replays its last mutation, which can be older than the fetch or part of it.
        remote: [older, tx2, tx3],
        expanded: [[expanded]],
      }),
    ).toEqual([
      {transactions: [tx1, tx2, tx3], live: true},
      {transactions: [expanded], live: false},
      {transactions: [older], live: false},
    ])
  })

  it('makes the transactions received the live chain before anything was fetched', () => {
    expect(getTransactionChains({fetched: [], remote: [tx1], expanded: []})).toEqual([
      {transactions: [tx1], live: true},
    ])
  })
})
